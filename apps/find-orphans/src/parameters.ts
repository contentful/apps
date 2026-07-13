import { BATCH_SIZE, MAX_CANDIDATES, UNTOUCHED_ONLY } from './locations/Page/utils/constants';

export interface AppInstallationParameters {
  /** Hard cap on candidate entries per scan. */
  maxCandidates: number;
  /** Concurrent CMA requests while scanning and archiving. */
  batchSize: number;
  /**
   * When true, only flag drafts that were never saved after creation
   * (sys.version === 1). Filters out untitled drafts someone has actually
   * worked on, at the cost of missing abandoned drafts that got one stray
   * edit.
   */
  untouchedOnly: boolean;
}

export const DEFAULT_PARAMETERS: AppInstallationParameters = {
  maxCandidates: MAX_CANDIDATES,
  batchSize: BATCH_SIZE,
  untouchedOnly: UNTOUCHED_ONLY,
};

const toPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 1
    ? Math.floor(parsed)
    : fallback;
};

const toBoolean = (value: unknown, fallback: boolean): boolean => {
  // Boolean parameters arrive as real booleans from the app definition, but
  // hand-edited parameters may store them as strings.
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return fallback;
};

/**
 * Merges raw installation parameters with defaults. Handles fresh installs
 * (empty object) and hand-edited or legacy values (strings, out-of-range).
 */
export const resolveParameters = (raw: unknown): AppInstallationParameters => {
  const params = (raw ?? {}) as Partial<Record<keyof AppInstallationParameters, unknown>>;
  return {
    maxCandidates: toPositiveInt(params.maxCandidates, DEFAULT_PARAMETERS.maxCandidates),
    // Capped at 7: the CMA rate limit is 7 requests/second per space.
    batchSize: Math.min(7, toPositiveInt(params.batchSize, DEFAULT_PARAMETERS.batchSize)),
    untouchedOnly: toBoolean(params.untouchedOnly, DEFAULT_PARAMETERS.untouchedOnly),
  };
};
