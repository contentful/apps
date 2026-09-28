/**
 * Formatting shared by the Robots views.
 *
 * Every one of these renders an em dash for "no value", so a cell that says nothing says it the
 * same way everywhere. What a blank cell *means* is a separate question — see `unitsCell` in
 * `RobotsJobTable`, which is where the distinction between empty and unknown is drawn.
 */

export const EM_DASH = '—';

/** Robots timestamps are Unix seconds, not milliseconds. */
export const formatTimestamp = (seconds?: number): string =>
  seconds ? new Date(seconds * 1000).toLocaleString() : EM_DASH;

/** The time of day alone, for a sentence about something that happened minutes ago. */
export const formatTimeOfDay = (seconds: number): string =>
  new Date(seconds * 1000).toLocaleTimeString();

/** A duration or offset in milliseconds, as `m:ss`. */
export const formatMs = (ms?: number): string => {
  if (typeof ms !== 'number') return EM_DASH;
  const totalSeconds = Math.floor(ms / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
};

export const formatSeconds = (seconds?: number): string =>
  typeof seconds === 'number' ? formatMs(seconds * 1000) : EM_DASH;

/** A model's 0–1 score. Two decimals, because that is the precision Mux reports. */
export const formatScore = (score: unknown): string =>
  typeof score === 'number' ? score.toFixed(2) : EM_DASH;

/** A field that may be missing, as text. */
export const formatText = (value: unknown): string =>
  value === undefined || value === null || value === '' ? EM_DASH : String(value);

/**
 * Reads an output key that should hold a list of objects.
 *
 * Robots outputs are `Record<string, unknown>`, and every shaped view needs the same guard before
 * it can map over one — the alternative being a cast that turns a missing key into a crash.
 */
export const asRows = (value: unknown): Array<Record<string, unknown>> =>
  Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];

/** The same, for a key that should hold a list of strings. */
export const asStrings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
