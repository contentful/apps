import { MuxContentfulObject } from './types';

/**
 * The stored version of the Mux field JSON.
 *
 * Kept in step with `functions/src/helpers/muxField.ts`, which needs the same rule server-side.
 * The two are separate packages with independent builds — the same split that already exists
 * between `util/apiClient.tsx` and `functions/src/helpers/muxClient.ts` — so the logic is small
 * and duplicated on purpose rather than shared through a build step.
 */

export const BASE_FIELD_VERSION = 3;

/**
 * One version for all of Robots, not one per key.
 *
 * `robotsJobs`, `robotsOutputs`, `robotsDirectiveRuns` and `robotsPendingCreates` all ship in the
 * same release, so no build ever writes one without knowing about the others. A version exists to tell apart shapes
 * written by *different* builds; four numbers here would describe a history that never happened,
 * and every one of them is a number some future reader has to keep straight.
 */
export const FIELD_VERSION_WITH_ROBOTS = 4;

/**
 * Derives the version from what the value actually holds, rather than asserting the newest one.
 *
 * This is what stops Robots from re-drafting every entry that predates it. Hard-coding `4` would
 * make the rebuilt value differ from what is on disk for every existing entry, so merely opening
 * one would trigger a `setValue`, which flips a published entry to "Changed" with no cause the
 * editor can see. Across the orgs on this app that is a visible editorial event for a feature
 * they have not used.
 *
 * An existing version is carried forward verbatim — v1 and v2 records included — and only raised
 * when the value actually holds Robots data. Never downgraded, including from a version newer
 * than this build understands: a rollback must not quietly rewrite what a later build wrote.
 */
export function deriveFieldVersion(value: Partial<MuxContentfulObject> | undefined): number {
  const carried = typeof value?.version === 'number' ? value.version : BASE_FIELD_VERSION;

  // The test is for a key being *present and populated* — never "this build knows about v4",
  // which is what would re-draft every entry that predates Robots.
  const jobs = value?.robotsJobs;
  const directiveRuns = value?.robotsDirectiveRuns;
  const pendingCreates = value?.robotsPendingCreates;

  // `Array.isArray` rather than a truthy `.length`, to match the functions copy exactly. The
  // field JSON is user-reachable data, and a string has a `length` too — an implementation that
  // tested truthiness would raise the version where one that checked the type would not, and the
  // two writers would then disagree forever about the same value.
  const holdsRobotsData =
    (Array.isArray(jobs) && jobs.length > 0) ||
    !!value?.robotsOutputs ||
    (Array.isArray(directiveRuns) && directiveRuns.length > 0) ||
    (Array.isArray(pendingCreates) && pendingCreates.length > 0);

  return Math.max(carried, holdsRobotsData ? FIELD_VERSION_WITH_ROBOTS : 0);
}
