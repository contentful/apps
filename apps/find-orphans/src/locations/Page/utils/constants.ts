/** Page size for CMA entry collection requests. */
export const PAGE_LIMIT = 100;

/**
 * Page size for the content types collection. The CMA allows up to 1000 per
 * request, so virtually every space loads its content model in one call.
 */
export const CONTENT_TYPE_PAGE_LIMIT = 1000;

/**
 * Default cap on candidate entries per scan, to protect against rate limits
 * on huge spaces. Overridable via the `maxCandidates` installation parameter.
 */
export const MAX_CANDIDATES = 500;

/**
 * Default number of concurrent CMA requests while scanning and archiving
 * (CMA limit: 7 req/s). Overridable via the `batchSize` installation
 * parameter.
 */
export const BATCH_SIZE = 5;

/**
 * Default for the `untouchedOnly` installation parameter: only flag drafts
 * that were never saved after creation (sys.version === 1). On by default
 * because a version-1 untitled draft is the purest orphan signature — the
 * entry was created (e.g. from a reference field) and then abandoned without
 * a single edit.
 */
export const UNTOUCHED_ONLY = true;

/** Display field types that can hold a title. */
export const TEXT_FIELD_TYPES = ['Symbol', 'Text'];
