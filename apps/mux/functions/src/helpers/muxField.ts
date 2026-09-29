/**
 * Shared knowledge about the shape of the Mux field JSON, used by `onPublish` when it writes
 * fresh Mux asset data back onto an entry.
 *
 * Historically the function built a brand new object from a fixed key list and assigned it over
 * every locale of the field. That silently destroyed any key it did not know about, wrote
 * `version: 1` over v3 records, and collapsed per-locale values into one shared object. Robots
 * makes all three fatal: `robotsJobs` and `robotsOutputs` are written only by the browser, so a
 * publish carrying a pending action would wipe them with no error and then publish the wiped
 * value. Everything here exists to make that write a merge instead of a replace.
 */

/** The Mux field version the app has written since before Robots existed. */
export const BASE_FIELD_VERSION = 3;

/**
 * One version for all of Robots, not one per key.
 *
 * `robotsJobs`, `robotsOutputs`, `robotsDirectiveRuns` and `robotsPendingCreates` all ship in the
 * same release, so no build ever writes one without knowing about the others. A version exists to
 * tell apart shapes written by *different* builds; four numbers would describe a history that
 * never happened.
 *
 * Kept in step with `frontend/src/util/muxFieldVersion.ts`, which owns the browser copy of this
 * rule. Both raise on a key being present and *populated*, never on this build merely knowing
 * the key exists: an entry that predates Robots must derive exactly the version it already has,
 * or every publish would rewrite it. See ADR-0006.
 */
export const FIELD_VERSION_WITH_ROBOTS = 4;

/**
 * Keys that mirror the Mux asset. `onPublish` re-derives these from a fresh
 * `GET /video/v1/assets/{id}` and may overwrite them. Any key *not* listed here belongs to
 * another writer and has to survive untouched.
 *
 * This list is not documentation: `buildAssetMirror` iterates it, and the mirror it builds is
 * typed by it, so a key listed here but missing from the mirror is a compile error rather than a
 * key that silently never clears. It used to be read by nothing at all, which is exactly why
 * `captions` and `audioTracks` being conditionally *omitted* from the mirror — and so never
 * cleared by a publish — went unnoticed.
 */
export const MUX_ASSET_MIRROR_KEYS = [
  'uploadId',
  'assetId',
  'playbackId',
  'signedPlaybackId',
  'drmPlaybackId',
  'ready',
  'ratio',
  'max_stored_resolution',
  'max_stored_frame_rate',
  'duration',
  'audioOnly',
  'error',
  'created_at',
  'captions',
  'audioTracks',
  'chaptersTrack',
  'static_renditions',
  'is_live',
  'live_stream_id',
  'meta',
  'passthrough',
] as const;

/** One of the keys `onPublish` owns. */
export type MuxAssetMirrorKey = (typeof MUX_ASSET_MIRROR_KEYS)[number];

/**
 * Build the asset mirror from a value per mirror key.
 *
 * Every key in `MUX_ASSET_MIRROR_KEYS` is written, `undefined` included. That is what makes a
 * mirror key *clear*: `mergeMuxAssetIntoField` spreads this over the stored value, and a key set
 * to `undefined` is dropped on the way through JSON, so the stored key disappears. A key that is
 * merely *absent* from the mirror does the opposite — the stored value keeps whatever it had.
 *
 * `captions` and `audioTracks` used to be spread in conditionally (`...(captions?.length && {
 * captions })`), so an asset whose last caption track had been deleted published with the old
 * list still attached. Taking the values as a `Record<MuxAssetMirrorKey, unknown>` is what stops
 * that shape from type-checking at all.
 */
export function buildAssetMirror(
  values: Record<MuxAssetMirrorKey, unknown>
): Record<string, unknown> {
  const mirror: Record<string, unknown> = {};
  for (const key of MUX_ASSET_MIRROR_KEYS) {
    mirror[key] = values[key];
  }
  return mirror;
}

/**
 * The version to store for a given value.
 *
 * Deliberately *derived* rather than asserted. Hard-coding the newest version would make the
 * stored value differ from what is on disk for every entry that predates Robots, which turns
 * merely opening an entry into a `setValue`, which flips a published entry to "Changed" with no
 * user-visible cause. So: carry the existing version forward, and only raise it when the value
 * actually contains the data that requires the newer version. Never downgrade.
 */
export function deriveFieldVersion(value: Record<string, unknown> | undefined | null): number {
  // A stored version is carried forward verbatim — including v1 and v2, which some entries still
  // hold. Raising those to `BASE_FIELD_VERSION` would change the value and re-draft the entry for
  // no reason, which is the whole thing this function exists to avoid. The base is only a default
  // for values that never had a version at all, matching what the app has always written.
  const carried =
    value && typeof value.version === 'number' ? (value.version as number) : BASE_FIELD_VERSION;

  // `Array.isArray` rather than a truthy `.length`, to match the browser copy exactly. The field
  // JSON is user-reachable data, and a string has a `length` too — an implementation that tested
  // truthiness would raise the version where one that checked the type would not, and the two
  // writers would then disagree forever about the same value.
  const jobs = value?.robotsJobs;
  const directiveRuns = value?.robotsDirectiveRuns;
  const pendingCreates = value?.robotsPendingCreates;
  const holdsRobotsData =
    (Array.isArray(jobs) && jobs.length > 0) ||
    !!value?.robotsOutputs ||
    (Array.isArray(directiveRuns) && directiveRuns.length > 0) ||
    (Array.isArray(pendingCreates) && pendingCreates.length > 0);

  return Math.max(carried, holdsRobotsData ? FIELD_VERSION_WITH_ROBOTS : 0);
}

/**
 * Overlay freshly-read Mux asset data onto one locale's existing field value.
 *
 * `existing` wins for every key the function does not own; `assetMirror` wins for the keys it
 * does. `pendingActions` is set only when actions failed and need retrying on the next publish —
 * otherwise it is cleared, which is what the publish is for.
 */
export function mergeMuxAssetIntoField(
  existing: Record<string, unknown> | undefined | null,
  assetMirror: Record<string, unknown>,
  failedPendingActions?: Record<string, unknown>
): Record<string, unknown> {
  const base = existing && typeof existing === 'object' ? existing : {};

  const merged: Record<string, unknown> = {
    ...base,
    ...assetMirror,
  };

  if (failedPendingActions) {
    merged.pendingActions = failedPendingActions;
  } else {
    // Deleted, not set to `null`. Two reasons, both about not changing what existing entries
    // hold:
    //
    // 1. The previous implementation built a fresh object and simply omitted the key, so every
    //    published value out there has no `pendingActions` once its actions have run. Writing
    //    `null` instead would differ from that, and the browser's `normalizeForDiff` strips
    //    `undefined` but keeps `null` — so it would see a change and write the field again,
    //    bumping the entry version for nothing.
    // 2. `findPendingActionsInMuxFields` tests `'pendingActions' in value`, which is true for
    //    `null`. Storing `null` would make the *next* publish read `null.delete` and throw.
    delete merged.pendingActions;
  }

  merged.version = deriveFieldVersion(merged);

  return merged;
}
