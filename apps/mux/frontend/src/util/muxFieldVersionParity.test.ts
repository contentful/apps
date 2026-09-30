import { describe, expect, it } from 'vitest';
import {
  BASE_FIELD_VERSION,
  FIELD_VERSION_WITH_ROBOTS,
  deriveFieldVersion as deriveInBrowser,
} from './muxFieldVersion';

/**
 * The version rule is written twice — once for the browser, once for the App Function — because
 * they are separate packages with independent builds. Each side has its own tests; this file
 * exists because passing both of those is not the same as agreeing with each other.
 *
 * The stakes are why it is worth the unusual cross-package import. The two writers take turns on
 * the same field value, so a disagreement is not a cosmetic wrong number:
 *
 * - Derive too high on one side and every existing entry gets rewritten the moment it is opened
 *   or published — a "Changed" badge, across every org on this app, for a feature they never
 *   used. That is the hazard ADR-0006 exists for.
 * - Derive *differently* on the two sides for the same value and they never converge: the browser
 *   writes its answer, the function writes its own on the next publish, and the value flips back
 *   and forth for as long as the entry is edited.
 *
 * So the table below pins the exact number for every shape the field can be in. **An identical
 * table lives in `functions/src/helpers/muxFieldVersionParity.test.ts`** — the two packages cannot
 * import each other (separate `rootDir`s), so the tables are mirrored by hand. Change one only by
 * changing both, and only on purpose.
 */
describe('the two copies of the field-version rule agree', () => {
  const cases: Array<[string, Record<string, unknown> | undefined, number]> = [
    ['undefined', undefined, 3],
    ['an empty object', {}, 3],
    ['a v1 entry that predates everything', { version: 1 }, 1],
    ['a v2 entry', { version: 2 }, 2],
    ['a plain v3 asset mirror', { version: 3, assetId: 'a' }, 3],
    ['no version at all', { assetId: 'a' }, 3],
    ['an empty robotsJobs array', { version: 3, robotsJobs: [] }, 3],
    ['an empty directive-run array', { version: 3, robotsDirectiveRuns: [] }, 3],
    ['one job', { version: 3, robotsJobs: [{ id: 'j' }] }, 4],
    ['outputs but no jobs', { version: 3, robotsOutputs: { summarize: {} } }, 4],
    ['one directive run', { version: 3, robotsDirectiveRuns: [{ runId: 'r' }] }, 4],
    [
      'everything at once',
      {
        version: 3,
        robotsJobs: [{ id: 'j' }],
        robotsOutputs: {},
        robotsDirectiveRuns: [{ runId: 'r' }],
      },
      4,
    ],
    ['an already-v4 value', { version: 4, robotsJobs: [{ id: 'j' }] }, 4],
    // Carried forward, never lowered: a rolled-back build must not rewrite what a later one
    // wrote, even though it has no idea what the shape means.
    ['a version ahead of this build', { version: 99, robotsJobs: [{ id: 'j' }] }, 99],
    ['a version ahead of this build with no Robots data', { version: 99 }, 99],
    // Field JSON is reachable data, and a string has a `length` too. An implementation that
    // tested truthiness rather than `Array.isArray` would raise the version here; one that did
    // not would leave it — which is exactly the shape of disagreement that never converges.
    ['robotsJobs corrupted to a string', { version: 3, robotsJobs: 'nonsense' }, 3],
    [
      'robotsDirectiveRuns corrupted to an object',
      { version: 3, robotsDirectiveRuns: { a: 1 } },
      3,
    ],
    ['an empty pending-create array', { version: 3, robotsPendingCreates: [] }, 3],
    ['one pending create', { version: 3, robotsPendingCreates: [{ requestId: 'q' }] }, 4],
    [
      'robotsPendingCreates corrupted to an object',
      { version: 3, robotsPendingCreates: { a: 1 } },
      3,
    ],
    ['robotsOutputs corrupted to a string', { version: 3, robotsOutputs: 'nonsense' }, 4],
    ['a non-numeric version', { version: '4', robotsJobs: [{ id: 'j' }] }, 4],
  ];

  it.each(cases)('derives %s as the mirrored table says', (_label, value, expected) => {
    expect(deriveInBrowser(value as never)).toBe(expected);
  });

  it('numbers the versions the way the functions copy does', () => {
    expect(BASE_FIELD_VERSION).toBe(3);
    expect(FIELD_VERSION_WITH_ROBOTS).toBe(4);
  });

  it('never lowers a version it does not understand', () => {
    // Both sides must carry an unknown future version forward untouched — a build rolled back
    // must not quietly downgrade entries a newer build wrote.
    expect(deriveInBrowser({ version: 99 } as never)).toBe(99);
  });
});
