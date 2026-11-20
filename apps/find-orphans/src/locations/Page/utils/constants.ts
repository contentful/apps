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
 * Chunk size for the creator-name lookup: ids per `sys.id[in]` users query.
 * Keeps each request's id list comfortably inside query-string limits.
 */
export const USER_PAGE_LIMIT = 100;

/** Display field types that can hold a title. */
export const TEXT_FIELD_TYPES = ['Symbol', 'Text'];

/**
 * Rows per page in the results table. Purely a rendering choice: a scan
 * fetches every result up front, so paging costs no API calls — it only
 * keeps the results header (counts, filters, archive button) within reach
 * on large result sets.
 */
export const RESULTS_PAGE_SIZE = 50;
