// Cache configuration constants
export const CACHE_CONFIG = {
  // How long data is considered fresh (10 minutes)
  STALE_TIME_MS: 10 * 60 * 1000,
  // How long to keep unused data in cache (30 minutes) - gcTime in TanStack Query v5
  CACHE_TIME_MS: 30 * 60 * 1000,
  // Don't refetch on window focus to avoid unnecessary API calls
  REFETCH_ON_WINDOW_FOCUS: false,
} as const;

// Entry fetching configuration
export const FETCH_CONFIG = {
  // Default batch size for pagination (1000 is Contentful's max per request)
  DEFAULT_BATCH_SIZE: 1000,
  // Minimum batch size when reducing due to response size limits
  MIN_BATCH_SIZE: 100,
} as const;
