export const DISPLAY_NAME_COLUMN = 'notfield_displayName';
export const DISPLAY_NAME_INDEX = 0;
export const ENTRY_STATUS_COLUMN = 'notfield_status';
export const ENTRY_STATUS_INDEX = 1;
export const HEADERS_ROW = -1;
export const PAGE_TITLE = 'Bulk Edit';
export const PAGE_DESCRIPTION = 'Bulk edit your content entries';

export const DRAFT_STATUS = 'Draft';
export const CHANGED_STATUS = 'Changed';
export const PUBLISHED_STATUS = 'Published';
export const ARCHIVED_STATUS = 'Archived';
export const UNKNOWN_STATUS = 'Unknown';

export const BATCH_FETCHING = {
  DEFAULT_BATCH_SIZE: 100,
  MIN_BATCH_SIZE: 2,
} as const;

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
  CORS_QUERY_PARAM_LIMIT: 300,
} as const;

export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200, 500];

export const SIDEBAR_WIDTH = 200;
export const SPACER_SPACING = 24;
export const CELL_WIDTH = 200;
export const TABLE_WIDTH = CELL_WIDTH * 4;
export const FILTER_MULTISELECT_WIDTH = 300;
export const ESTIMATED_ROW_HEIGHT = 50;
