/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App, DiscardedFieldWriteError } from '.';
import { MuxContentfulObject } from './util/types';

/**
 * The serialized write path.
 *
 * These are the tests that would catch a regression to the lost-update race Robots introduced:
 * two independent poll loops doing read-modify-write on the same JSON field, where every writer
 * used to read `this.state.value` — refreshed only asynchronously through `onValueChanged`.
 */

vi.mock('contentful-management', () => ({
  createClient: vi.fn(() => ({
    appAction: { getManyForEnvironment: vi.fn(() => Promise.resolve({ items: [] })) },
    appActionCall: {
      createWithResponse: vi.fn(() =>
        Promise.resolve({ response: { body: JSON.stringify({ ok: true, data: {} }) } })
      ),
    },
  })),
}));

vi.mock('@mux/mux-player-react', () => ({ default: vi.fn(() => null) }));

vi.mock('./util/muxApi', () => ({
  MuxApiService: {
    getInstance: vi.fn(() =>
      Promise.resolve({
        // Deliberately never resolves an asset, so the asset poll cannot write behind our back and
        // muddy what these tests are measuring.
        getAsset: vi.fn(() => new Promise(() => undefined)),
        listRobotsJobs: vi.fn(() => Promise.resolve({ data: [] })),
        listRobotsDirectives: vi.fn(() => Promise.resolve({ data: [] })),
        listRobotsDirectiveRuns: vi.fn(() => Promise.resolve({ data: [] })),
        getSignedUrlTokens: vi.fn(() =>
          Promise.resolve({ playbackToken: '', posterToken: '', storyboardToken: '' })
        ),
      })
    ),
  },
  MuxApiError: class MuxApiError extends Error {},
  addByURL: vi.fn(),
  getUploadUrl: vi.fn(),
  buildAssetSettings: vi.fn(),
}));

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

interface Harness {
  app: App;
  read: () => MuxContentfulObject | undefined;
  setValue: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  /** Fire the sys change the app reads as "this entry was just published". */
  publish: () => void;
  write: (next: MuxContentfulObject | undefined) => void;
}

const mount = (initial: Partial<MuxContentfulObject>, writeDelayMs = 5): Harness => {
  let stored = initial as MuxContentfulObject | undefined;

  const setValue = vi.fn(async (next: MuxContentfulObject | undefined) => {
    // A slow write is what makes an unserialized second writer overlap the first.
    await new Promise((resolve) => setTimeout(resolve, writeDelayMs));
    stored = next;
  });
  const save = vi.fn(async () => undefined);

  let onSysChanged: ((sys: Record<string, unknown>) => void) | undefined;
  let publishCount = 0;

  const sdk = {
    ids: { environment: 'env', space: 'space', organization: 'org', app: 'app' },
    parameters: {
      installation: {
        muxAccessTokenId: 'id',
        muxAccessTokenSecret: 'secret',
        muxDomain: 'mux.com',
      },
    },
    field: {
      id: 'muxVideo',
      getValue: () => stored,
      setValue,
      onValueChanged: () => () => undefined,
    },
    window: { startAutoResizer: () => null },
    entry: {
      getSys: () => ({ id: 'entry', publishedVersion: 1, version: 2, publishedAt: 'now' }),
      onSysChanged: (callback: (sys: Record<string, unknown>) => void) => {
        onSysChanged = callback;
        return () => undefined;
      },
      save,
      fields: {},
    },
    contentType: { fields: [] },
    locales: { default: 'en-US' },
    cmaAdapter: {},
    notifier: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
    dialogs: { openConfirm: vi.fn(() => Promise.resolve(true)) },
  };

  const ref = React.createRef<App>();
  render(<App ref={ref} sdk={sdk as any} />);

  return {
    app: ref.current as App,
    read: () => stored,
    setValue,
    save,
    // Exactly what the app subscribes to: version === publishedVersion + 1 and a publishedAt it
    // has not handled before. Whether the gate opens is then decided by the *stored* value still
    // carrying `pendingActions`, which is the publish function's own signal that it is about to
    // rewrite this field from the server.
    publish: () => {
      publishCount += 1;
      onSysChanged?.({
        id: 'entry',
        publishedVersion: publishCount + 1,
        version: publishCount + 2,
        publishedAt: `publish-${publishCount}`,
      });
    },
    write: (next) => {
      stored = next;
    },
  };
};

describe('App.updateField', () => {
  beforeEach(() => vi.clearAllMocks());

  it('serializes concurrent writers, so neither loses the other’s change', async () => {
    const { app, read } = mount({ version: 3, assetId: 'asset-1', ready: true });

    // Both start before either finishes — exactly the shape of the asset loop and the Robots loop
    // writing at the same time.
    await Promise.all([
      app.updateField((current) => ({ ...(current as MuxContentfulObject), ratio: '16:9' })),
      app.updateField((current) => ({
        ...(current as MuxContentfulObject),
        robotsJobs: [{ id: 'rjob_1', workflow: 'summarize', status: 'completed' }],
      })),
    ]);

    const stored = read();
    expect(stored?.ratio).toBe('16:9');
    expect(stored?.robotsJobs).toHaveLength(1);
  });

  it('hands each mutator the stored value, not stale React state', async () => {
    const { app } = mount({ version: 3, assetId: 'asset-1', ready: true });
    const seen: Array<number | undefined> = [];

    await Promise.all([
      app.updateField((current) => {
        seen.push(current?.duration);
        return { ...(current as MuxContentfulObject), duration: 1 };
      }),
      app.updateField((current) => {
        seen.push(current?.duration);
        return { ...(current as MuxContentfulObject), duration: 2 };
      }),
    ]);

    // The second mutator must observe the first one's write.
    expect(seen).toEqual([undefined, 1]);
  });

  it('does not write when the mutator returns the value it was given', async () => {
    const { app, setValue } = mount({ version: 3, assetId: 'asset-1', ready: true });
    setValue.mockClear();

    await app.updateField((current) => current);

    expect(setValue).not.toHaveBeenCalled();
  });

  it('does not write when the new value is only structurally identical', async () => {
    const { app, setValue } = mount({ version: 3, assetId: 'asset-1', ready: true });
    setValue.mockClear();

    // A fresh object, reordered keys, an explicit undefined — none of it is a change, and writing
    // it would flip a published entry to "Changed" for nothing.
    await app.updateField(() => ({
      ready: true,
      assetId: 'asset-1',
      version: 3,
      ratio: undefined,
    }));

    expect(setValue).not.toHaveBeenCalled();
  });

  it('keeps the chain alive after a write fails', async () => {
    const { app, read, setValue } = mount({ version: 3, assetId: 'asset-1', ready: true });

    setValue.mockImplementationOnce(async () => {
      throw new Error('conflict');
    });

    await expect(
      app.updateField((current) => ({ ...(current as MuxContentfulObject), duration: 1 }))
    ).rejects.toThrow('conflict');

    await app.updateField((current) => ({ ...(current as MuxContentfulObject), duration: 2 }));

    expect(read()?.duration).toBe(2);
  });

  it('applies writers in call order', async () => {
    const { app, read } = mount({ version: 3, assetId: 'asset-1', ready: true });

    await Promise.all([
      app.updateField((current) => ({ ...(current as MuxContentfulObject), ratio: 'first' })),
      app.updateField((current) => ({ ...(current as MuxContentfulObject), ratio: 'second' })),
      app.updateField((current) => ({ ...(current as MuxContentfulObject), ratio: 'third' })),
    ]);

    expect(read()?.ratio).toBe('third');
  });

  it('stops writing once the component is gone', async () => {
    const { app, setValue } = mount({ version: 3, assetId: 'asset-1', ready: true });
    setValue.mockClear();

    app.componentWillUnmount();
    await app.updateField((current) => ({ ...(current as MuxContentfulObject), duration: 99 }));
    await tick();

    expect(setValue).not.toHaveBeenCalled();
  });
});

/**
 * The publish gate, and what a caller is owed for a write it parks.
 *
 * The gate holds browser writes for up to 90 seconds while the publish function rewrites the
 * field server-side. For that whole window `updateField` used to return from the deferred path
 * without writing *and without throwing*, and `componentWillUnmount` then threw the queue away.
 * So: stage a caption change, publish, start a Robots job inside the window, close the tab — the
 * job record is gone, the job is still running and billing, and the caller's `await` had already
 * resolved as though it were stored.
 */
describe('App.updateField — writes parked behind the publish gate', () => {
  beforeEach(() => vi.clearAllMocks());

  const pendingActions = {
    delete: [{ type: 'caption' as const, id: 'track-1', retry: 0 }],
    create: [],
    update: [],
  };

  /**
   * An entry published while it carried pending actions — the state that shuts the gate.
   *
   * The tick matters: the app subscribes to sys changes inside `componentDidMount`, after it has
   * awaited the Mux client, so a publish fired before that lands is a publish nobody heard.
   */
  const gated = async () => {
    const harness = mount({
      version: 3,
      assetId: 'asset-1',
      ready: true,
      pendingActions,
    } as Partial<MuxContentfulObject>);
    await tick();
    harness.publish();
    return harness;
  };

  const job = { id: 'rjob_1', workflow: 'summarize', status: 'completed' } as const;

  /** Attaches a handler now, so a rejection later is never an unhandled one. */
  const outcomeOf = (promise: Promise<void>) =>
    promise.then(
      () => 'resolved',
      (error: Error) => error
    );

  /** Resolves to 'settled' only if the promise beats a macrotask. */
  const settlementOf = (promise: Promise<unknown>) =>
    Promise.race([
      promise.then(
        () => 'resolved',
        () => 'rejected'
      ),
      tick().then(() => 'pending'),
    ]);

  it('holds the write, and does not report it as done', async () => {
    const harness = await gated();

    const write = harness.app.updateField((current) => ({
      ...(current as MuxContentfulObject),
      robotsJobs: [job],
    }));

    expect(await settlementOf(write)).toBe('pending');
    expect(harness.setValue).not.toHaveBeenCalled();

    // Left parked on purpose: the auto-cleanup unmount flushes it, which is the next test.
    harness.app.componentWillUnmount();
    await write;
  });

  it('applies the parked write when the publish function’s own publish lands', async () => {
    const harness = await gated();

    const write = harness.app.updateField((current) => ({
      ...(current as MuxContentfulObject),
      robotsJobs: [job],
    }));
    await tick();

    // The function cleared the pending actions and republished.
    harness.write({ version: 3, assetId: 'asset-1', ready: true } as MuxContentfulObject);
    harness.publish();

    await write;
    expect(harness.read()?.robotsJobs).toHaveLength(1);
  });

  it('flushes the queue on unmount instead of dropping it', async () => {
    const harness = await gated();

    const write = harness.app.updateField((current) => ({
      ...(current as MuxContentfulObject),
      robotsJobs: [job],
    }));
    await tick();

    harness.app.componentWillUnmount();

    await expect(write).resolves.toBeUndefined();
    expect(harness.read()?.robotsJobs).toHaveLength(1);
  });

  it('flushes every parked mutator, in order, in one write', async () => {
    const harness = await gated();

    const first = harness.app.updateField((current) => ({
      ...(current as MuxContentfulObject),
      robotsJobs: [job],
    }));
    const second = harness.app.updateField((current) => ({
      ...(current as MuxContentfulObject),
      robotsJobs: [
        ...((current as MuxContentfulObject).robotsJobs ?? []),
        { ...job, id: 'rjob_2' },
      ],
    }));
    await tick();

    harness.app.componentWillUnmount();
    await Promise.all([first, second]);

    // Each mutator saw the one before it, and the entry took a single write rather than two.
    expect(harness.setValue).toHaveBeenCalledTimes(1);
    expect(harness.read()?.robotsJobs?.map((j) => j.id)).toEqual(['rjob_1', 'rjob_2']);
  });

  it('tells the caller when the flush write itself fails', async () => {
    const harness = await gated();

    const outcome = outcomeOf(
      harness.app.updateField((current) => ({
        ...(current as MuxContentfulObject),
        robotsJobs: [job],
      }))
    );
    await tick();

    harness.setValue.mockImplementationOnce(async () => {
      throw new Error('the tab is going away');
    });
    harness.app.componentWillUnmount();

    // The whole point: a dropped write is distinguishable from a written one. This used to
    // resolve, with nothing written anywhere.
    expect(await outcome).toBeInstanceOf(DiscardedFieldWriteError);
  });

  it('lets one broken mutator fail without taking the rest of the queue with it', async () => {
    const harness = await gated();

    const broken = outcomeOf(
      harness.app.updateField(() => {
        throw new Error('bad mutator');
      })
    );
    const good = harness.app.updateField((current) => ({
      ...(current as MuxContentfulObject),
      robotsJobs: [job],
    }));
    await tick();

    harness.app.componentWillUnmount();

    expect(await broken).toHaveProperty('message', 'bad mutator');
    await expect(good).resolves.toBeUndefined();
    expect(harness.read()?.robotsJobs).toHaveLength(1);
  });

  it('says a write is parked the moment it is, before the promise settles', async () => {
    const harness = await gated();
    const onParked = vi.fn();

    const write = harness.app.updateField(
      (current) => ({ ...(current as MuxContentfulObject), robotsJobs: [job] }),
      { onParked }
    );
    await tick();

    expect(onParked).toHaveBeenCalledTimes(1);
    expect(await settlementOf(write)).toBe('pending');

    // Released by the function's republish, the promise resolves with the write made.
    harness.write({ version: 3, assetId: 'asset-1', ready: true } as MuxContentfulObject);
    harness.publish();
    await expect(write).resolves.toBeUndefined();
    expect(harness.read()?.robotsJobs).toHaveLength(1);
    expect(onParked).toHaveBeenCalledTimes(1);
  });

  it('never says so for a write made with the gate shut', async () => {
    const harness = mount({ version: 3, assetId: 'asset-1', ready: true });
    await tick();
    const onParked = vi.fn();

    await harness.app.updateField(
      (current) => ({ ...(current as MuxContentfulObject), robotsJobs: [job] }),
      { onParked }
    );

    expect(onParked).not.toHaveBeenCalled();
    expect(harness.read()?.robotsJobs).toHaveLength(1);
  });

  it('says so again when a second publish parks the released write once more', async () => {
    const harness = await gated();
    const onParked = vi.fn();

    const write = harness.app.updateField(
      (current) => ({ ...(current as MuxContentfulObject), robotsJobs: [job] }),
      { onParked }
    );
    await tick();
    expect(onParked).toHaveBeenCalledTimes(1);

    // The republish releases it, and before the chain applies it another publish with pending
    // actions shuts the gate again.
    harness.write({ version: 3, assetId: 'asset-1', ready: true } as MuxContentfulObject);
    harness.publish();
    harness.write({
      version: 3,
      assetId: 'asset-1',
      ready: true,
      pendingActions,
    } as Partial<MuxContentfulObject> as MuxContentfulObject);
    harness.publish();
    await tick();

    expect(onParked).toHaveBeenCalledTimes(2);
    expect(await settlementOf(write)).toBe('pending');
    harness.app.componentWillUnmount();
    await write;
  });

  it('drops a parked write that asked not to be flushed, and flushes the rest', async () => {
    const harness = await gated();

    const dropped = outcomeOf(
      harness.app.updateField(
        (current) => ({ ...(current as MuxContentfulObject), robotsPendingCreates: [] }),
        { flushOnUnmount: false, save: true }
      )
    );
    const flushed = harness.app.updateField((current) => ({
      ...(current as MuxContentfulObject),
      robotsJobs: [job],
    }));
    await tick();

    harness.app.componentWillUnmount();

    const error = await dropped;
    expect(error).toBeInstanceOf(DiscardedFieldWriteError);
    expect((error as Error).message).toBe('The editor closed before this write could be made.');
    await expect(flushed).resolves.toBeUndefined();
    expect(harness.read()?.robotsJobs).toHaveLength(1);
    expect(harness.read() && 'robotsPendingCreates' in (harness.read() as object)).toBe(false);
    // The dropped write asked for a save; nothing that was flushed did.
    expect(harness.save).not.toHaveBeenCalled();
  });

  it('does not deadlock when writes queue up behind a parked one', async () => {
    const harness = await gated();

    // The parked mutator is released through `updateField` itself, so the write chain must not be
    // waiting on it — otherwise the release queues behind the thing it is releasing.
    const first = harness.app.updateField((current) => ({
      ...(current as MuxContentfulObject),
      ratio: '4:3',
    }));
    const second = harness.app.updateField((current) => ({
      ...(current as MuxContentfulObject),
      duration: 12,
    }));
    await tick();

    harness.write({ version: 3, assetId: 'asset-1', ready: true } as MuxContentfulObject);
    harness.publish();

    await Promise.all([first, second]);
    expect(harness.read()?.ratio).toBe('4:3');
    expect(harness.read()?.duration).toBe(12);
  });
});

/**
 * `options.save`.
 *
 * `sdk.field.setValue` resolves when the value reaches the web app over the postMessage bridge;
 * persisting it is the web app's own autosave, on its own schedule. For the asset mirror that is
 * free — the next open re-derives it from Mux. For a record of a job that is already running and
 * billing, the window between the two is where it gets orphaned.
 */
describe('App.updateField — options.save', () => {
  beforeEach(() => vi.clearAllMocks());

  const value = () => ({ version: 3, assetId: 'asset-1', ready: true });

  it('does not save unless asked', async () => {
    const harness = mount(value());

    await harness.app.updateField((current) => ({
      ...(current as MuxContentfulObject),
      duration: 5,
    }));

    expect(harness.setValue).toHaveBeenCalled();
    expect(harness.save).not.toHaveBeenCalled();
  });

  it('saves after a write that changed something', async () => {
    const harness = mount(value());

    await harness.app.updateField(
      (current) => ({ ...(current as MuxContentfulObject), duration: 5 }),
      { save: true }
    );

    expect(harness.save).toHaveBeenCalledTimes(1);
    expect(harness.read()?.duration).toBe(5);
  });

  it('does not save when the write was a no-op', async () => {
    const harness = mount(value());
    harness.setValue.mockClear();

    await harness.app.updateField((current) => current, { save: true });

    // A no-op write must stay a no-op all the way through: saving here would flip a published
    // entry to "Changed" for a poll tick that learned nothing.
    expect(harness.setValue).not.toHaveBeenCalled();
    expect(harness.save).not.toHaveBeenCalled();
  });

  it('treats a failed save as a warning, not a failed write', async () => {
    const harness = mount(value());
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    harness.save.mockImplementationOnce(async () => {
      throw new Error('conflict');
    });

    await expect(
      harness.app.updateField((current) => ({ ...(current as MuxContentfulObject), duration: 5 }), {
        save: true,
      })
    ).resolves.toBeUndefined();

    // The value is in the editor's buffer either way; reporting this as a failed write would make
    // the caller retry something that already happened.
    expect(harness.read()?.duration).toBe(5);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('carries the option through the publish gate', async () => {
    const harness = mount({
      version: 3,
      assetId: 'asset-1',
      ready: true,
      pendingActions: { delete: [{ type: 'caption', id: 't1', retry: 0 }], create: [], update: [] },
    } as Partial<MuxContentfulObject>);
    await tick();
    harness.publish();

    const write = harness.app.updateField(
      (current) => ({
        ...(current as MuxContentfulObject),
        robotsJobs: [{ id: 'rjob_1', workflow: 'summarize', status: 'completed' }],
      }),
      { save: true }
    );
    await tick();

    harness.app.componentWillUnmount();
    await write;

    // Nothing is going to autosave on behalf of a closing tab, so the flush has to ask.
    expect(harness.save).toHaveBeenCalledTimes(1);
  });
});
