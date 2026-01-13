/**
 * PostHog Analytics App - Shared Type Definitions
 * Based on data-model.md specification
 */

// =============================================================================
// Installation Parameters
// =============================================================================

/**
 * Configuration for a content type's URL/slug mapping
 */
export interface ContentTypeSlugConfig {
  /** Field ID containing the slug */
  slugField: string;
  /** Base URL prefix (e.g., "https://example.com/blog/") */
  urlPrefix: string;
}

/**
 * Maps Contentful content type IDs to their URL/slug configuration
 */
export interface ContentTypeMapping {
  [contentTypeId: string]: ContentTypeSlugConfig;
}

/**
 * App installation parameters stored in Contentful
 */
export interface PostHogConfiguration {
  /** Personal API key for PostHog authentication */
  posthogApiKey: string;
  /** PostHog project ID */
  posthogProjectId: string;
  /** PostHog instance URL (us/eu cloud or custom) */
  posthogHost: 'us' | 'eu' | string;
  /** Mapping of content types to URL fields */
  contentTypes: ContentTypeMapping;
}

/**
 * URL mapping for a content type to its frontend URL pattern.
 */
export interface UrlMapping {
  /** The Contentful content type ID */
  contentTypeId: string;
  /** URL pattern with {slug} placeholder (e.g., "https://example.com/blog/{slug}") */
  urlPattern: string;
}

/**
 * App installation parameters stored in Contentful.
 * This is the root configuration object saved when the app is installed.
 */
export interface AppInstallationParameters {
  /** Personal API key for PostHog API authentication (phx_...) */
  personalApiKey?: string;
  /** Project API key for client-side tracking (phc_...) - optional */
  projectApiKey?: string;
  /** PostHog project ID */
  projectId?: string;
  /** PostHog host URL (us.posthog.com, eu.posthog.com, or custom) */
  posthogHost?: string;
  /** URL mappings for content types */
  urlMappings: UrlMapping[];
}

// =============================================================================
// Analytics Entities
// =============================================================================

/**
 * Date range options for analytics queries
 */
export type DateRange = 'today' | 'last7days' | 'last30days';

/**
 * Aggregated analytics data for a specific page
 */
export interface AnalyticsMetrics {
  /** Total page view events */
  pageViews: number;
  /** Count of distinct persons */
  uniqueVisitors: number;
  /** Average session duration in seconds */
  avgSessionDuration: number;
  /** Time period for metrics */
  dateRange: DateRange;
  /** URL being analyzed */
  pageUrl: string;
}

/**
 * Time-series data point for charts
 */
export interface AnalyticsDataPoint {
  /** ISO date string */
  date: string;
  /** Page views for this date */
  pageViews: number;
  /** Unique visitors for this date */
  uniqueVisitors: number;
}

// =============================================================================
// Session Recording Entities
// =============================================================================

/**
 * Represents a recorded user session from PostHog
 */
export interface SessionRecording {
  /** PostHog recording ID */
  id: string;
  /** User identifier */
  distinctId: string;
  /** ISO timestamp of session start */
  startTime: string;
  /** ISO timestamp of session end (optional for simple queries) */
  endTime?: string;
  /** Recording duration in seconds */
  duration: number;
  /** Active time (excluding idle) */
  activeSeconds?: number;
  /** Link to view in PostHog dashboard */
  viewUrl?: string;
  /** Alternative: URL to recording (used by posthog.ts) */
  recordingUrl?: string;
}

/**
 * API response for listing recordings
 */
export interface SessionRecordingListResponse {
  recordings: SessionRecording[];
  hasMore: boolean;
  totalCount: number;
}

// =============================================================================
// Feature Flag Entities
// =============================================================================

/**
 * Represents a PostHog feature flag
 */
export interface FeatureFlag {
  /** PostHog flag ID */
  id: number;
  /** Unique flag key */
  key: string;
  /** Human-readable name */
  name: string;
  /** Whether flag is enabled */
  active: boolean;
  /** Percentage rollout (0-100) */
  rolloutPercentage: number | null;
  /** ISO timestamp */
  createdAt: string;
  /** Creator email */
  createdBy: string;
}

/**
 * API response for listing flags
 */
export interface FeatureFlagListResponse {
  flags: FeatureFlag[];
  totalCount: number;
}

/**
 * Request to toggle a feature flag
 */
export interface FeatureFlagToggleRequest {
  flagId: number;
  active: boolean;
}

// =============================================================================
// Error Entities
// =============================================================================

/**
 * Error codes for the app
 */
export type ErrorCode =
  | 'INVALID_API_KEY'
  | 'PROJECT_NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'NETWORK_ERROR'
  | 'PERMISSION_DENIED'
  | 'NOT_CONFIGURED'
  | 'SLUG_NOT_FOUND'
  | 'UNKNOWN_ERROR';

/**
 * Standardized error format for the app
 */
export interface AppError {
  code: ErrorCode;
  message: string;
  details?: string;
  recoverable: boolean;
}

// =============================================================================
// UI State Entities
// =============================================================================

/**
 * React state for the sidebar component
 */
export interface SidebarState {
  // View state
  activeTab: 'analytics' | 'recordings' | 'flags';
  isLoading: boolean;
  error: string | null;

  // Analytics state
  analytics: AnalyticsMetrics | null;
  selectedDateRange: DateRange;

  // Recordings state
  recordings: SessionRecording[];
  recordingsLoading: boolean;

  // Feature flags state
  featureFlags: FeatureFlag[];
  flagsLoading: boolean;
  togglingFlagId: number | null;
}

/**
 * Content type info from Contentful
 */
export interface ContentTypeInfo {
  id: string;
  name: string;
  fields: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

/**
 * React state for the configuration screen
 */
export interface ConfigScreenState {
  // Connection settings
  apiKey: string;
  projectId: string;
  host: 'us' | 'eu' | string;

  // Validation state
  isTestingConnection: boolean;
  connectionStatus: 'untested' | 'success' | 'error';
  connectionError: string | null;

  // Content type mappings
  contentTypes: ContentTypeMapping;
  availableContentTypes: ContentTypeInfo[];

  // Save state
  isSaving: boolean;
}

// =============================================================================
// Legacy Type Aliases (for compatibility with existing components)
// =============================================================================

/**
 * Alternative date range type used by posthog.ts
 */
export type DateRangeType = 'today' | 'last7d' | 'last30d';

/**
 * Entry statistics from PostHog (legacy naming)
 */
export interface EntryStats {
  pageviews: number;
  uniqueUsers: number;
}

/**
 * Daily statistics (legacy naming)
 */
export interface DailyStats {
  date: string;
  pageviews: number;
  uniqueUsers: number;
}

/**
 * Date range options configuration
 */
export const DATE_RANGE_OPTIONS: Record<
  DateRangeType,
  { label: string; days: number; interval: string }
> = {
  today: { label: 'Today', days: 1, interval: '1 DAY' },
  last7d: { label: 'Last 7 days', days: 7, interval: '7 DAY' },
  last30d: { label: 'Last 30 days', days: 30, interval: '30 DAY' },
};
