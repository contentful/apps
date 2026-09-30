import { MuxContentfulObject, PolicyType } from './types';

/**
 * What playback policy the field's asset is on, and what it is about to be on.
 *
 * These read the stored value rather than Mux, so they cost nothing and work while a tab is open
 * on a value the poll has not refreshed. They live here because two callers need exactly the same
 * answer and used to compute it separately: `App.swapPlaybackIDs`, which decides whether a click
 * is a no-op, and `PlaybackSwitcher`, which decides what the radios show. The two disagreed on
 * an asset holding both a public and a DRM playback ID — the switcher said public, the swap said
 * DRM — so picking DRM in the UI was silently dropped as "already DRM". One function, one answer.
 */

/** Whether the asset has a playback ID of any policy. */
export function hasAnyPlaybackId(value: MuxContentfulObject | undefined): boolean {
  return !!(value?.playbackId || value?.signedPlaybackId || value?.drmPlaybackId);
}

/**
 * The policy the asset is on now, from the IDs it actually holds.
 *
 * `undefined` means there is no playback ID of any kind — a real state, reached by a `moderate`
 * run with `on_flagged.action: delete_playback_ids` or by a delete in the Mux dashboard. It is
 * deliberately not folded into `'public'`: the difference between "public" and "nothing" is the
 * difference between a swap and a create, and treating them alike is what made requesting a
 * public playback ID impossible from the Playback tab.
 */
export function existingPlaybackPolicy(
  value: MuxContentfulObject | undefined
): PolicyType | undefined {
  if (value?.playbackId) return 'public';
  if (value?.signedPlaybackId) return 'signed';
  if (value?.drmPlaybackId) return 'drm';
  return undefined;
}

/** The policy of a queued create that has not been applied by `onPublish` yet, if there is one. */
export function pendingPlaybackPolicy(
  value: MuxContentfulObject | undefined
): PolicyType | undefined {
  const create = value?.pendingActions?.create?.find((action) => action.type === 'playback');
  return create?.data?.policy;
}

/**
 * What the editor should see selected: the queued change if there is one, otherwise what is
 * stored. `undefined` when the asset has no playback ID and none is queued.
 */
export function currentPlaybackPolicy(
  value: MuxContentfulObject | undefined
): PolicyType | undefined {
  return pendingPlaybackPolicy(value) ?? existingPlaybackPolicy(value);
}
