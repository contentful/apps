import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('contentful-management', () => ({ createClient: vi.fn() }));
vi.mock('./helpers/muxClient', () => ({ muxFetch: vi.fn() }));

import { createClient } from 'contentful-management';
import { muxFetch } from './helpers/muxClient';
import { buildMuxAssetMirror, findPendingActionsInMuxFields, handler } from './onPublish';
import { MUX_ASSET_MIRROR_KEYS, mergeMuxAssetIntoField } from './helpers/muxField';

const muxField = (locales: Record<string, unknown>) => ({ muxVideo: locales });

const asset = (overrides: Record<string, unknown> = {}) => ({
  id: 'asset-1',
  status: 'ready',
  playback_ids: [{ id: 'playback-1', policy: 'public' }],
  ...overrides,
});

const captionTrack = (overrides: Record<string, unknown> = {}) => ({
  id: 'track-1',
  type: 'text',
  text_type: 'subtitles',
  status: 'ready',
  language_code: 'en-US',
  ...overrides,
});

describe('findPendingActionsInMuxFields', () => {
  it('ignores fields with no pending actions', () => {
    expect(
      findPendingActionsInMuxFields(muxField({ 'en-US': { assetId: 'asset-1', ready: true } }))
    ).toEqual({});
  });

  it('ignores fields that are not Mux fields', () => {
    expect(findPendingActionsInMuxFields({ title: { 'en-US': 'A title' } })).toEqual({});
    expect(findPendingActionsInMuxFields(undefined)).toEqual({});
    expect(findPendingActionsInMuxFields(null)).toEqual({});
  });

  it('collects actions from the default locale', () => {
    const result = findPendingActionsInMuxFields(
      muxField({
        'en-US': {
          assetId: 'asset-1',
          pendingActions: {
            delete: [{ type: 'caption', id: 'track-1', retry: 0 }],
            create: [],
            update: [],
          },
        },
      })
    );

    expect(result).toEqual({
      muxVideo: { delete: [{ type: 'caption', id: 'track-1', retry: 0 }], assetId: 'asset-1' },
    });
  });

  it('reads only the first locale, unchanged from before Robots', () => {
    // Deliberate: scanning every locale would make this publish execute actions queued in a
    // non-default locale that have never run, which for an asset delete is destructive and would
    // arrive as a surprise on installs that already exist.
    const result = findPendingActionsInMuxFields(
      muxField({
        'en-US': { assetId: 'asset-1', ready: true },
        'de-DE': {
          assetId: 'asset-1',
          pendingActions: { delete: [{ type: 'audio', id: 'track-2', retry: 0 }] },
        },
      })
    );

    expect(result).toEqual({});
  });

  it('drops actions that have exhausted their retries', () => {
    expect(
      findPendingActionsInMuxFields(
        muxField({
          'en-US': {
            assetId: 'asset-1',
            pendingActions: { delete: [{ type: 'caption', id: 'track-1', retry: 4 }] },
          },
        })
      )
    ).toEqual({});
  });

  it('drops actions with no retry counter', () => {
    expect(
      findPendingActionsInMuxFields(
        muxField({
          'en-US': {
            assetId: 'asset-1',
            pendingActions: { delete: [{ type: 'caption', id: 'track-1' }] },
          },
        })
      )
    ).toEqual({});
  });

  it('tolerates a null pendingActions left behind by a previous publish', () => {
    expect(
      findPendingActionsInMuxFields(
        muxField({ 'en-US': { assetId: 'asset-1', pendingActions: null } })
      )
    ).toEqual({});
  });
});

/**
 * The caption filter, and the mirror keys that never cleared.
 *
 * Both are about the same failure: a publish leaving the entry holding tracks the asset does not
 * have. One did it by filtering differently from the browser, the other by omitting the key so
 * the merge kept the stale array.
 */
describe('buildMuxAssetMirror', () => {
  it('writes every mirror key, so each one can clear', () => {
    const mirror = buildMuxAssetMirror(asset());

    // Not `toContain` per key: the point is that the mirror and the key list cannot drift. A key
    // added to `MUX_ASSET_MIRROR_KEYS` and forgotten here is the bug this pins.
    expect(Object.keys(mirror).sort()).toEqual([...MUX_ASSET_MIRROR_KEYS].sort());
  });

  it('clears captions and audioTracks when the asset has none left', () => {
    const mirror = buildMuxAssetMirror(asset({ tracks: [] }));

    // Present-and-undefined, not absent. Absent is what used to leave the stale list in place.
    expect('captions' in mirror).toBe(true);
    expect(mirror.captions).toBeUndefined();
    expect('audioTracks' in mirror).toBe(true);
    expect(mirror.audioTracks).toBeUndefined();
  });

  it('drops a caption the asset no longer has, instead of preserving it through the merge', () => {
    const existing = {
      version: 3,
      assetId: 'asset-1',
      captions: [captionTrack()],
      audioTracks: [{ id: 'audio-1', type: 'audio' }],
      robotsOutputs: { summarize: { title: 'Kept' } },
    };

    const merged = mergeMuxAssetIntoField(existing, buildMuxAssetMirror(asset({ tracks: [] })));

    // `undefined` survives to the CMA as an absent key — the same mechanism every other mirror
    // key has always relied on.
    expect(merged.captions).toBeUndefined();
    expect(merged.audioTracks).toBeUndefined();
    expect('captions' in JSON.parse(JSON.stringify(merged))).toBe(false);
    // The correction must not cost the browser-owned keys on its way past.
    expect(merged.robotsOutputs).toEqual({ summarize: { title: 'Kept' } });
  });

  it('keeps the tracks that are still there', () => {
    const tracks = [captionTrack(), { id: 'audio-1', type: 'audio', status: 'ready' }];
    const mirror = buildMuxAssetMirror(asset({ tracks }));

    expect(mirror.captions).toEqual([tracks[0]]);
    expect(mirror.audioTracks).toEqual([tracks[1]]);
  });

  it('filters captions the way the browser does, not by track type alone', () => {
    const tracks = [
      captionTrack({ id: 'ready' }),
      captionTrack({ id: 'preparing', status: 'preparing' }),
      // The three the old `t.type === 'text'` filter let through. Each one reappeared on the
      // entry at publish time after the browser had already filtered it out.
      captionTrack({ id: 'errored', status: 'errored' }),
      captionTrack({ id: 'deleted', status: 'deleted' }),
      captionTrack({ id: 'cues', text_type: 'cues' }),
    ];

    const mirror = buildMuxAssetMirror(asset({ tracks }));

    expect((mirror.captions as { id: string }[]).map((t) => t.id)).toEqual(['ready', 'preparing']);
  });

  it('survives an asset with no tracks and no playback ids at all', () => {
    const mirror = buildMuxAssetMirror({ id: 'asset-1', status: 'preparing' });

    expect(mirror.assetId).toBe('asset-1');
    expect(mirror.ready).toBe(false);
    expect(mirror.playbackId).toBeUndefined();
    expect(mirror.captions).toBeUndefined();
  });
});

/**
 * The create half of `pendingActions`, driven through the handler.
 *
 * Contentful can now *ask* for a playback ID, not only swap one: an asset whose playback IDs a
 * `moderate` run deleted is recoverable from the Playback tab, through this path. Which makes the
 * shape of a queued create load-bearing in a way it was not when every create came paired with a
 * delete of the ID it replaced.
 */
describe('handler — creating a playback ID from a queued action', () => {
  const entryWith = (create: unknown[]) => ({
    sys: {
      id: 'entry-1',
      environment: { sys: { id: 'master' } },
      space: { sys: { id: 'space-1' } },
    },
    fields: {
      muxVideo: {
        'en-US': {
          assetId: 'asset-1',
          pendingActions: { delete: [], create, update: [] },
        },
      },
    },
  });

  const runHandler = async (create: unknown[]) => {
    const entry = entryWith(create);
    let stored: any = JSON.parse(JSON.stringify(entry));

    vi.mocked(createClient).mockReturnValue({
      entry: {
        get: vi.fn(async () => JSON.parse(JSON.stringify(stored))),
        update: vi.fn(async (_params: unknown, updated: any) => {
          stored = updated;
          return updated;
        }),
        publish: vi.fn(async () => stored),
      },
    } as any);

    vi.mocked(muxFetch).mockImplementation(
      async (_credentials: unknown, method: string) =>
        ({
          ok: true,
          status: 200,
          json: async () =>
            method === 'GET' ? { data: { id: 'asset-1', status: 'ready', playback_ids: [] } } : {},
        } as any)
    );

    await handler(
      { type: 'appevent.handler', body: entry },
      {
        appInstallationParameters: {
          muxAccessTokenId: 'id',
          muxAccessTokenSecret: 'secret',
          muxDRMConfigurationId: 'drm-config-1',
        },
        cmaClientOptions: {},
      }
    );

    return vi.mocked(muxFetch).mock.calls.filter(([, , path]) => path.includes('/playback-ids'));
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts the queued policy', async () => {
    const calls = await runHandler([
      { type: 'playback', data: { policy: 'public', assetId: 'asset-1' }, retry: 0 },
    ]);

    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toBe('POST');
    expect(calls[0][2]).toBe('/video/v1/assets/asset-1/playback-ids');
    expect(JSON.parse(calls[0][3] as string)).toEqual({ policy: 'public' });
  });

  it('attaches the DRM configuration only for a drm create', async () => {
    const calls = await runHandler([
      { type: 'playback', data: { policy: 'drm', assetId: 'asset-1' }, retry: 0 },
    ]);

    expect(JSON.parse(calls[0][3] as string)).toEqual({
      policy: 'drm',
      drm_configuration_id: 'drm-config-1',
    });
  });

  it('refuses a create with no policy instead of posting an empty body', async () => {
    // `JSON.stringify({ policy: undefined })` is `{}`, so this would have let Mux pick the policy
    // on an asset whose playback a moderation run had just deleted. The twin of the delete action
    // with no `id`, which issued `DELETE /assets/{id}/playback-ids` against the collection.
    const calls = await runHandler([{ type: 'playback', data: { assetId: 'asset-1' }, retry: 0 }]);

    expect(calls).toEqual([]);
  });
});

/**
 * What the field holds after a queued asset delete is published.
 *
 * Asked directly by review: does deleting a video leave JSON residue behind — a value with no
 * `assetId` but still carrying `robotsJobs`, `robotsOutputs` or `robotsDirectiveRuns`? It does
 * not, and this pins that, because the shape of the answer is the opposite of what a merge
 * function usually does: `GET /video/v1/assets/{id}` 404s, and the whole field is dropped rather
 * than merged into.
 */
describe('handler — publishing a queued asset delete', () => {
  const entryWithDeletedAsset = () => ({
    sys: {
      id: 'entry-1',
      environment: { sys: { id: 'master' } },
      space: { sys: { id: 'space-1' } },
    },
    fields: {
      muxVideo: {
        'en-US': {
          version: 4,
          assetId: 'asset-1',
          playbackId: 'playback-1',
          captions: [captionTrack()],
          robotsJobs: [{ id: 'rjob_1', workflow: 'summarize', status: 'completed' }],
          robotsOutputs: { summarize: { jobId: 'rjob_1', title: 'Generated title' } },
          robotsDirectiveRuns: [{ runId: 'drvrun_1', directiveId: 'drv_1' }],
          pendingActions: {
            delete: [{ type: 'asset', id: 'asset-1', retry: 0 }],
            create: [],
            update: [],
          },
        },
      },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('removes the whole field, leaving no Robots records behind on a value with no asset', async () => {
    const entry = entryWithDeletedAsset();
    let stored: any = JSON.parse(JSON.stringify(entry));

    vi.mocked(createClient).mockReturnValue({
      entry: {
        get: vi.fn(async () => JSON.parse(JSON.stringify(stored))),
        update: vi.fn(async (_params: unknown, updated: any) => {
          stored = updated;
          return updated;
        }),
        publish: vi.fn(async () => stored),
      },
    } as any);

    vi.mocked(muxFetch).mockImplementation(async (_credentials: unknown, method: string) =>
      method === 'DELETE'
        ? ({ ok: true, status: 200, json: async () => ({}) } as any)
        : // The asset is gone, so the refresh read 404s.
          ({ ok: false, status: 404, json: async () => ({}) } as any)
    );

    await handler(
      { type: 'appevent.handler', body: entry },
      {
        appInstallationParameters: { muxAccessTokenId: 'id', muxAccessTokenSecret: 'secret' },
        cmaClientOptions: {},
      }
    );

    // The asset was deleted at Mux...
    expect(
      vi
        .mocked(muxFetch)
        .mock.calls.some(
          ([, method, path]) => method === 'DELETE' && path === '/video/v1/assets/asset-1'
        )
    ).toBe(true);

    // ...and the field is dropped outright, not merged down to a husk. `undefined` is how a key
    // is removed on the way to the CMA, so nothing partial survives — no `robotsJobs` on a value
    // with no `assetId`, and nothing for the browser to pick back up.
    expect(stored.fields.muxVideo).toBeUndefined();
    expect(JSON.stringify(stored)).not.toContain('robotsJobs');
    expect(JSON.stringify(stored)).not.toContain('robotsOutputs');
    expect(JSON.stringify(stored)).not.toContain('robotsDirectiveRuns');
  });
});

/**
 * The one asset write `onPublish` makes. `PATCH /video/v1/assets/{id}` takes a `passthrough` too,
 * and sending one would overwrite whatever the customer keeps there, so the body is pinned whole.
 */
describe('handler — publishing a queued metadata update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("changes the title and nothing else, never the asset's passthrough", async () => {
    const entry = {
      sys: {
        id: 'entry-1',
        environment: { sys: { id: 'master' } },
        space: { sys: { id: 'space-1' } },
      },
      fields: {
        muxVideo: {
          'en-US': {
            assetId: 'asset-1',
            passthrough: 'customer-order-42',
            pendingActions: {
              delete: [],
              create: [],
              update: [{ type: 'metadata', data: { title: 'New title' }, retry: 0 }],
            },
          },
        },
      },
    };
    let stored: unknown = JSON.parse(JSON.stringify(entry));

    vi.mocked(createClient).mockReturnValue({
      entry: {
        get: vi.fn(async () => JSON.parse(JSON.stringify(stored))),
        update: vi.fn(async (_params: unknown, updated: unknown) => {
          stored = updated;
          return updated;
        }),
        publish: vi.fn(async () => stored),
      },
    } as never);

    vi.mocked(muxFetch).mockImplementation(
      async (_credentials: unknown, method: string) =>
        ({
          ok: true,
          status: 200,
          json: async () =>
            method === 'GET'
              ? { data: asset({ passthrough: 'customer-order-42', meta: { title: 'New title' } }) }
              : {},
        } as never)
    );

    await handler(
      { type: 'appevent.handler', body: entry },
      {
        appInstallationParameters: { muxAccessTokenId: 'id', muxAccessTokenSecret: 'secret' },
        cmaClientOptions: {},
      }
    );

    const patches = vi.mocked(muxFetch).mock.calls.filter(([, method]) => method === 'PATCH');
    expect(patches).toHaveLength(1);
    expect(patches[0][2]).toBe('/video/v1/assets/asset-1');
    expect(JSON.parse(patches[0][3] as string)).toEqual({ meta: { title: 'New title' } });
  });
});
