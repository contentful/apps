import { describe, expect, it } from 'vitest';
import {
  BASE_FIELD_VERSION,
  FIELD_VERSION_WITH_ROBOTS,
  deriveFieldVersion,
} from './muxFieldVersion';
import { MuxContentfulObject } from './types';

const value = (extra: Partial<MuxContentfulObject>): Partial<MuxContentfulObject> => ({
  assetId: 'asset-1',
  ...extra,
});

describe('deriveFieldVersion', () => {
  it('leaves a v3 record on v3 — the whole point, so existing entries are not re-drafted', () => {
    expect(deriveFieldVersion(value({ version: 3 }))).toBe(3);
  });

  it('leaves pre-v3 records exactly where they are', () => {
    expect(deriveFieldVersion(value({ version: 1 }))).toBe(1);
    expect(deriveFieldVersion(value({ version: 2 }))).toBe(2);
  });

  it('defaults an unversioned value to the base version, as the app always has', () => {
    expect(deriveFieldVersion(value({}))).toBe(BASE_FIELD_VERSION);
    expect(deriveFieldVersion(undefined)).toBe(BASE_FIELD_VERSION);
  });

  it('raises to v4 when robotsJobs holds records', () => {
    expect(
      deriveFieldVersion(
        value({
          robotsJobs: [{ id: 'rjob_1', workflow: 'summarize', status: 'completed' }],
        })
      )
    ).toBe(FIELD_VERSION_WITH_ROBOTS);
  });

  it('does not raise for an empty robotsJobs array', () => {
    expect(deriveFieldVersion(value({ version: 3, robotsJobs: [] }))).toBe(3);
  });

  it('raises to the same v4 for robotsOutputs', () => {
    // One version for all of Robots: the three keys ship in one release, so there is no build
    // that writes outputs without knowing about jobs, and nothing for a second number to tell
    // apart.
    expect(
      deriveFieldVersion(value({ robotsOutputs: { summarize: { jobId: 'rjob_1', title: 'A' } } }))
    ).toBe(FIELD_VERSION_WITH_ROBOTS);
  });

  it('raises to the same v4 when robotsDirectiveRuns holds records', () => {
    expect(
      deriveFieldVersion(
        value({ robotsDirectiveRuns: [{ runId: 'drvrun_1', directiveId: 'drv_1' }] })
      )
    ).toBe(FIELD_VERSION_WITH_ROBOTS);
  });

  it('does not raise for an empty robotsDirectiveRuns array', () => {
    expect(deriveFieldVersion(value({ version: 3, robotsDirectiveRuns: [] }))).toBe(3);
  });

  it('leaves every entry that predates directive runs exactly where it was', () => {
    // The one that matters. If v6 were asserted rather than derived, merely opening any existing
    // entry would rewrite its version and flip a published entry to "Changed" — across every org
    // on this app, for a key none of them have.
    expect(deriveFieldVersion(value({ version: 3 }))).toBe(3);
    expect(
      deriveFieldVersion(
        value({
          version: 5,
          robotsJobs: [{ id: 'rjob_1', workflow: 'summarize', status: 'completed' }],
          robotsOutputs: { summarize: { jobId: 'rjob_1', title: 'A' } },
        })
      )
    ).toBe(5);
  });

  it('never downgrades a v6 value whose runs are gone from the field', () => {
    expect(deriveFieldVersion(value({ version: 6, robotsOutputs: {} }))).toBe(6);
  });

  it('never downgrades a v5 value that only has jobs left', () => {
    expect(
      deriveFieldVersion(
        value({
          version: 5,
          robotsJobs: [{ id: 'rjob_1', workflow: 'summarize', status: 'completed' }],
        })
      )
    ).toBe(5);
  });
});
