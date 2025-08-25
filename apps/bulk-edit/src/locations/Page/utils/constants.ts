export const DISPLAY_NAME_COLUMN = 'notfield_displayName';
export const ENTRY_STATUS_COLUMN = 'notfield_status';
export const PAGE_TITLE = 'Bulk Edit';
export const PAGE_DESCRIPTION = 'Bulk edit your content entries';

// Batch fetching configuration - used in entryUtils.ts
export const BATCH_FETCHING = {
  // Default batch size for fetching entries
  DEFAULT_BATCH_SIZE: 100,
  // Minimum batch size when reducing due to response size limits
  MIN_BATCH_SIZE: 25,
  // Delay between batches to avoid rate limiting (ms)
  BATCH_DELAY_MS: 50,
  // Maximum entries to fetch in a single operation
  MAX_ENTRIES_PER_FETCH: 10000,
} as const;

// Batch processing for bulk operations - used in index.tsx
export const BATCH_PROCESSING = {
  // Align with Contentful's bulk action limit of 200 items
  DEFAULT_BATCH_SIZE: 50,
  // Align with CMA rate limit: 10 calls per second = 100ms between calls
  // Using 200ms to be conservative and account for network latency
  DEFAULT_DELAY_MS: 200,
} as const;

// API limits - used in index.tsx
export const API_LIMITS = {
  DEFAULT_PAGINATION_LIMIT: 1000,
  CORS_QUERY_PARAM_LIMIT: 300, // Maximum number of IDs that can be passed in a single query parameter
} as const;

// Page size options - used in index.tsx
export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200, 300, 500];
