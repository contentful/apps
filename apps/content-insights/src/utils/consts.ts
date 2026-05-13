import { CreatorViewSetting } from './types';

// Configuration ranges
export const NEEDS_UPDATE_MONTHS_RANGE = { min: 1, max: 24 };
export const RECENTLY_PUBLISHED_DAYS_RANGE = { min: 1, max: 30 };
export const TIME_TO_PUBLISH_DAYS_RANGE = { min: 7, max: 90 };
export const ITEMS_PER_PAGE = 5;

// Creator view options
export const CREATOR_VIEW_OPTIONS: { value: CreatorViewSetting; label: string }[] = [
  { value: CreatorViewSetting.TopFiveCreators, label: 'Top five creators' },
  { value: CreatorViewSetting.BottomFiveCreators, label: 'Bottom five creators' },
  { value: CreatorViewSetting.Alphabetical, label: 'Alphabetical' },
];

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
  MIN_BATCH_SIZE: 15,
} as const;
