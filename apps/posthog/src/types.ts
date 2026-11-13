/**
 * PostHog Analytics App - Shared Types
 */

// ============================================================================
// Date Range Types
// ============================================================================

/**
 * Available date range options for analytics
 */
export type DateRangeType = 'last24h' | 'last7d' | 'last14d' | 'last30d';

/**
 * Date range configuration
 */
export interface DateRangeConfig {
  label: string;
  days: number;
  interval: string; // HogQL interval string
}

/**
 * Available date range options
 */
export const DATE_RANGE_OPTIONS: Record<DateRangeType, DateRangeConfig> = {
  last24h: { label: 'Last 24 hours', days: 1, interval: '1 DAY' },
  last7d: { label: 'Last 7 days', days: 7, interval: '7 DAY' },
  last14d: { label: 'Last 14 days', days: 14, interval: '14 DAY' },
  last30d: { label: 'Last 30 days', days: 30, interval: '30 DAY' },
};

// ============================================================================
// App Configuration Types
// ============================================================================

/**
 * URL mapping configuration for a content type
 */
export interface UrlMapping {
  /** The Contentful content type ID (e.g., "blogPost") */
  contentTypeId: string;
  /** The URL pattern with {slug} placeholder (e.g., "https://example.com/blog/{slug}") */
  urlPattern: string;
}

/**
 * App installation parameters stored in Contentful
 */
export interface AppInstallationParameters {
  /** Project API Key (public key) for frontend event tracking */
  projectApiKey?: string;
  /** Personal API Key for API access (private) */
  personalApiKey?: string;
  /** PostHog Project ID (numeric) */
  projectId?: string;
  /** PostHog host URL (e.g., "https://us.posthog.com") */
  posthogHost?: string;
  /** URL mappings for content types */
  urlMappings?: UrlMapping[];
}

// ============================================================================
// Analytics Data Types
// ============================================================================

/**
 * Entry statistics from PostHog
 */
export interface EntryStats {
  /** Total page views in the period */
  pageviews: number;
  /** Unique users/visitors */
  uniqueUsers: number;
}

/**
 * Daily statistics for charts
 */
export interface DailyStats {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Page views for the day */
  pageviews: number;
  /** Unique users for the day */
  uniqueUsers: number;
}

/**
 * Session recording metadata
 */
export interface SessionRecording {
  /** Recording ID */
  id: string;
  /** Truncated distinct ID for display */
  distinctId: string;
  /** Recording duration in seconds */
  duration: number;
  /** Recording start timestamp (ISO string) */
  startTime: string;
  /** Full URL to watch the recording in PostHog */
  recordingUrl: string;
}
