export const REDIRECT_CONTENT_TYPE_ID = 'redirectAppRedirect';

export const ITEMS_PER_PAGE = 5;

export const PAGE_SIZE_OPTIONS = [25, 50, 100];

// Cache configuration constants
export const CACHE_CONFIG = {
  // How long data is considered fresh (10 minutes)
  STALE_TIME_MS: 10 * 60 * 1000,
  // How long to keep unused data in cache (30 minutes) - gcTime in TanStack Query v5
  CACHE_TIME_MS: 30 * 60 * 1000,
  // Don't refetch on window focus to avoid unnecessary API calls
  REFETCH_ON_WINDOW_FOCUS: false,
} as const;

export const TYPE_FILTER_OPTIONS = ['Permanent (301)', 'Temporary (302)'];
export const STATUS_FILTER_OPTIONS = ['Active', 'Inactive'];
