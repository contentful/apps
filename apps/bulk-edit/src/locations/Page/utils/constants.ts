export const DISPLAY_NAME_COLUMN = 'notfield_displayName';
export const ENTRY_STATUS_COLUMN = 'notfield_status';
export const PAGE_TITLE = 'Bulk Edit';
export const PAGE_DESCRIPTION = 'Bulk edit your content entries';

export const ERROR_MESSAGES = {
  LOADING_ERROR: 'Failed to load data',
  SAVE_ERROR: 'Failed to save changes',
} as const;

//TODO: Figure out if this are the right values
export const BATCH_PROCESSING = {
  // Align with Contentful's bulk action limit of 200 items
  DEFAULT_BATCH_SIZE: 50,
  // Align with CMA rate limit: 10 calls per second = 100ms between calls
  // Using 200ms to be conservative and account for network latency
  DEFAULT_DELAY_MS: 100,
} as const;

export const API_LIMITS = {
  DEFAULT_PAGINATION_LIMIT: 1000,
} as const;
