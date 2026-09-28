import { describe, expect, it } from 'vitest';
import {
  BASE_FIELD_VERSION,
  FIELD_VERSION_WITH_ROBOTS,
  MUX_ASSET_MIRROR_KEYS,
  buildAssetMirror,
  deriveFieldVersion,
  mergeMuxAssetIntoField,
} from './muxField';

const assetMirror = {
  assetId: 'asset-1',
  playbackId: 'playback-1',
  ready: true,
  duration: 12.5,
};

describe('deriveFieldVersion', () => {
  it('carries an existing version forward rather than asserting the newest one', () => {
    expect(deriveFieldVersion({ version: 3, assetId: 'a' })).toBe(3);
    expect(deriveFieldVersion({ version: 2, assetId: 'a' })).toBe(2);
  });

  it('defaults to the base version when none is stored', () => {
    expect(deriveFieldVersion({ assetId: 'a' })).toBe(BASE_FIELD_VERSION);
    expect(deriveFieldVersion(undefined)).toBe(BASE_FIELD_VERSION);
  });

  it('raises to v4 only when robotsJobs actually holds records', () => {
    expect(deriveFieldVersion({ assetId: 'a', robotsJobs: [] })).toBe(BASE_FIELD_VERSION);
    expect(deriveFieldVersion({ assetId: 'a', robotsJobs: [{ id: 'rjob_1' }] })).toBe(
      FIELD_VERSION_WITH_ROBOTS
    );
  });

  it('raises to the same v4 for outputs and for directive runs', () => {
    // One version covers all of Robots. The three keys ship together, so no build ever writes one
    // without the others and there is no shape to tell apart — numbering them separately would
    // describe a history that never happened.
    expect(deriveFieldVersion({ assetId: 'a', robotsOutputs: { summarize: {} } })).toBe(
      FIELD_VERSION_WITH_ROBOTS
    );
    expect(deriveFieldVersion({ assetId: 'a', robotsDirectiveRuns: [{ id: 'rrun_1' }] })).toBe(
      FIELD_VERSION_WITH_ROBOTS
    );
    expect(
      deriveFieldVersion({
        robotsJobs: [{ id: 'rjob_1' }],
        robotsOutputs: { summarize: {} },
        robotsDirectiveRuns: [{ id: 'rrun_1' }],
      })
    ).toBe(FIELD_VERSION_WITH_ROBOTS);
  });

  it('treats an empty array as no data, for every Robots key', () => {
    // An empty array must derive the version the entry already has, or a publish rewrites every
    // entry that ever opened the Robots tab without running anything.
    expect(deriveFieldVersion({ assetId: 'a', robotsDirectiveRuns: [] })).toBe(BASE_FIELD_VERSION);
    expect(deriveFieldVersion({ assetId: 'a', robotsJobs: [], robotsDirectiveRuns: [] })).toBe(
      BASE_FIELD_VERSION
    );
  });

  it('never downgrades a value whose stored version is ahead of its contents', () => {
    expect(deriveFieldVersion({ version: 9, robotsJobs: [{ id: 'rjob_1' }] })).toBe(9);
    expect(deriveFieldVersion({ version: 9, assetId: 'a' })).toBe(9);
  });

  it('leaves values that predate Robots exactly where they are', () => {
    // The ADR-0006 property: adding keys to the shape must not move a single existing entry.
    expect(deriveFieldVersion({ version: 1, assetId: 'a' })).toBe(1);
    expect(deriveFieldVersion({ version: 2, assetId: 'a' })).toBe(2);
    expect(deriveFieldVersion({ version: 3, assetId: 'a' })).toBe(3);
  });
});

describe('buildAssetMirror', () => {
  const everyKey = () =>
    Object.fromEntries(MUX_ASSET_MIRROR_KEYS.map((key) => [key, undefined])) as Record<
      (typeof MUX_ASSET_MIRROR_KEYS)[number],
      unknown
    >;

  it('writes every mirror key, present and undefined rather than absent', () => {
    const mirror = buildAssetMirror(everyKey());

    expect(Object.keys(mirror).sort()).toEqual([...MUX_ASSET_MIRROR_KEYS].sort());
    for (const key of MUX_ASSET_MIRROR_KEYS) {
      expect(key in mirror).toBe(true);
    }
  });

  it('clears a stored key when the mirror value is undefined', () => {
    const merged = mergeMuxAssetIntoField(
      { version: 3, assetId: 'asset-1', captions: [{ id: 'track-1' }] },
      buildAssetMirror({ ...everyKey(), assetId: 'asset-1' })
    );

    expect(merged.captions).toBeUndefined();
  });
});

describe('mergeMuxAssetIntoField', () => {
  it('preserves browser-owned Robots keys through a publish', () => {
    const existing = {
      version: 5,
      assetId: 'asset-1',
      playbackId: 'stale-playback',
      robotsJobs: [{ id: 'rjob_1', workflow: 'summarize', status: 'completed' }],
      robotsOutputs: { summarize: { title: 'Kept' } },
    };

    const merged = mergeMuxAssetIntoField(existing, assetMirror);

    expect(merged.robotsJobs).toEqual(existing.robotsJobs);
    expect(merged.robotsOutputs).toEqual(existing.robotsOutputs);
    expect(merged.playbackId).toBe('playback-1');
    expect(merged.version).toBe(5);
  });

  it('keeps robotsPendingCreates untouched through a publish', () => {
    // The guard on a Robots create that has not been confirmed yet. Browser-owned, like the rest.
    const existing = {
      version: FIELD_VERSION_WITH_ROBOTS,
      assetId: 'asset-1',
      robotsPendingCreates: [
        { requestId: '9f2c0b7a41d3e865', kind: 'job', workflow: 'summarize', requestedAt: 1 },
      ],
    };

    const merged = mergeMuxAssetIntoField(existing, assetMirror);

    expect(merged.robotsPendingCreates).toEqual(existing.robotsPendingCreates);
    expect(merged.version).toBe(FIELD_VERSION_WITH_ROBOTS);
  });

  it('preserves an output whose job was never recorded here, at v4', () => {
    // What an entry holds once the browser keeps a summary from a job started elsewhere: outputs,
    // and no job records to go with them. See ADR-0005's 2026-09-25 amendment.
    const existing = {
      version: FIELD_VERSION_WITH_ROBOTS,
      assetId: 'asset-1',
      robotsOutputs: { summarize: { jobId: 'rjob_dashboard', completedAt: 1, title: 'Kept' } },
    };

    const merged = mergeMuxAssetIntoField(existing, assetMirror);

    expect(merged.robotsOutputs).toEqual(existing.robotsOutputs);
    expect('robotsJobs' in merged).toBe(false);
    expect(merged.version).toBe(FIELD_VERSION_WITH_ROBOTS);
  });

  it('does not downgrade version to 1 the way the previous replace did', () => {
    const merged = mergeMuxAssetIntoField({ version: 3, assetId: 'asset-1' }, assetMirror);
    expect(merged.version).toBe(3);
  });

  it('removes the pendingActions key entirely when every action succeeded', () => {
    const merged = mergeMuxAssetIntoField(
      { version: 3, assetId: 'asset-1', pendingActions: { delete: [{ type: 'caption' }] } },
      assetMirror
    );
    // Not `null`: the key has to be absent, matching what published entries already hold. A
    // stored `null` would both differ from what is on disk (bumping the entry version on the next
    // browser write) and make the next publish's pendingActions scan index into null.
    expect('pendingActions' in merged).toBe(false);
  });

  it('re-attaches only the actions that failed', () => {
    const failed = { delete: [{ type: 'caption', id: 't1', retry: 1 }], create: [], update: [] };
    const merged = mergeMuxAssetIntoField({ version: 3, assetId: 'asset-1' }, assetMirror, failed);
    expect(merged.pendingActions).toEqual(failed);
  });

  it('keeps unknown keys written by a newer app version', () => {
    const merged = mergeMuxAssetIntoField(
      { version: 3, assetId: 'asset-1', somethingNewer: { a: 1 } },
      assetMirror
    );
    expect(merged.somethingNewer).toEqual({ a: 1 });
  });

  it('produces an independent object per call so locales cannot alias each other', () => {
    const a = mergeMuxAssetIntoField({ assetId: 'asset-1', robotsOutputs: { x: 1 } }, assetMirror);
    const b = mergeMuxAssetIntoField({ assetId: 'asset-1' }, assetMirror);
    expect(a).not.toBe(b);
    expect(b.robotsOutputs).toBeUndefined();
  });

  it('tolerates a missing or non-object existing value', () => {
    expect(mergeMuxAssetIntoField(undefined, assetMirror).assetId).toBe('asset-1');
    expect(mergeMuxAssetIntoField(null, assetMirror).version).toBe(BASE_FIELD_VERSION);
  });
});

describe('deriveFieldVersion — pre-v3 values', () => {
  it('leaves a v1 or v2 value exactly as it is', () => {
    expect(deriveFieldVersion({ version: 1, assetId: 'a' })).toBe(1);
    expect(deriveFieldVersion({ version: 2, assetId: 'a' })).toBe(2);
  });

  it('still raises a pre-v3 value that gains Robots data', () => {
    expect(deriveFieldVersion({ version: 2, robotsJobs: [{ id: 'rjob_1' }] })).toBe(
      FIELD_VERSION_WITH_ROBOTS
    );
  });
});
