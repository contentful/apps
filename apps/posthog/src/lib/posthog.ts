/**
 * PostHog API Client
 *
 * Handles all communication with the PostHog API including:
 * - HogQL queries for analytics data
 * - Session recordings retrieval
 *
 * @see https://posthog.com/docs/api
 * @see https://posthog.com/docs/hogql
 */

import type { EntryStats, DailyStats, SessionRecording, DateRangeType } from '../types';
import { DATE_RANGE_OPTIONS } from '../types';

// Re-export types for convenience
export type { EntryStats, DailyStats, SessionRecording } from '../types';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface PostHogConfig {
  personalApiKey: string;
  projectId: string;
  posthogHost: string;
}

interface HogQLResponse {
  results: unknown[][];
  columns: string[];
  types: string[];
  hasMore?: boolean;
  error?: string;
}

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

// ============================================================================
// Constants
// ============================================================================

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_PREFIX = 'posthog_cache_';

// ============================================================================
// PostHog Client Class
// ============================================================================

export class PostHogClient {
  private readonly personalApiKey: string;
  private readonly projectId: string;
  private readonly baseUrl: string;

  constructor(config: PostHogConfig) {
    if (!config.personalApiKey) {
      throw new Error('PostHog Personal API Key is required');
    }
    if (!config.projectId) {
      throw new Error('PostHog Project ID is required');
    }
    if (!config.posthogHost) {
      throw new Error('PostHog host is required');
    }

    this.personalApiKey = config.personalApiKey;
    this.projectId = config.projectId;
    // Ensure host doesn't have trailing slash
    this.baseUrl = config.posthogHost.replace(/\/$/, '');
  }

  // ==========================================================================
  // Private: HTTP Request Handler
  // ==========================================================================

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.personalApiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage: string;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.error || errorText;
      } catch {
        errorMessage = errorText;
      }

      throw new PostHogApiError(
        `PostHog API error (${response.status}): ${errorMessage}`,
        response.status,
        errorMessage
      );
    }

    return response.json() as Promise<T>;
  }

  // ==========================================================================
  // Private: Cache Management
  // ==========================================================================

  private getCacheKey(method: string, ...args: string[]): string {
    return `${CACHE_PREFIX}${this.projectId}_${method}_${args.join('_')}`;
  }

  private getFromCache<T>(cacheKey: string): T | null {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      if (Date.now() > entry.expiry) {
        sessionStorage.removeItem(cacheKey);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  }

  private setCache<T>(cacheKey: string, data: T): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        expiry: Date.now() + CACHE_DURATION_MS,
      };
      sessionStorage.setItem(cacheKey, JSON.stringify(entry));
    } catch {
      // If sessionStorage is full or unavailable, silently fail
      console.warn('PostHog cache: Unable to store in sessionStorage');
    }
  }

  // ==========================================================================
  // Private: URL Pattern Matching
  // ==========================================================================

  /**
   * Converts a URL pattern with placeholders to a regex-compatible LIKE clause
   *
   * Example:
   * - Pattern: "https://example.com/blog/{slug}"
   * - Slug: "hello-world"
   * - Result: "%/blog/hello-world%"
   */
  private buildUrlLikeClause(urlPattern: string, slug: string): string {
    // Replace {slug} placeholder with actual slug value
    const resolvedUrl = urlPattern.replace(/\{slug\}/gi, slug);

    // Extract the path portion for matching
    // This allows matching regardless of protocol or domain variations
    try {
      const url = new URL(resolvedUrl);
      return `%${url.pathname}%`;
    } catch {
      // If it's not a valid URL, use as-is with wildcards
      return `%${resolvedUrl.replace(/^https?:\/\/[^/]+/, '')}%`;
    }
  }

  // ==========================================================================
  // Private: HogQL Query Executor
  // ==========================================================================

  private async executeHogQLQuery(query: string): Promise<HogQLResponse> {
    return this.request<HogQLResponse>(`/api/projects/${this.projectId}/query`, {
      method: 'POST',
      body: JSON.stringify({
        query: {
          kind: 'HogQLQuery',
          query,
        },
      }),
    });
  }

  // ==========================================================================
  // Public: Entry Statistics
  // ==========================================================================

  /**
   * Fetches pageview statistics for a specific entry
   *
   * @param slug - The entry's slug field value
   * @param urlPattern - The URL pattern from configuration (e.g., "https://site.com/blog/{slug}")
   * @param dateRange - The date range to query (default: 'last7d')
   * @returns Object containing pageviews, unique users, and average time on page
   */
  async getEntryStats(
    slug: string,
    urlPattern: string,
    dateRange: DateRangeType = 'last7d'
  ): Promise<EntryStats> {
    const cacheKey = this.getCacheKey('entryStats', slug, urlPattern, dateRange);
    const cached = this.getFromCache<EntryStats>(cacheKey);
    if (cached) return cached;

    const urlLikeClause = this.buildUrlLikeClause(urlPattern, slug);
    const intervalDays = DATE_RANGE_OPTIONS[dateRange].interval;

    // HogQL query to fetch pageviews and unique visitors
    // Note: avg time on page requires complex session analysis, so we keep it simple
    const query = `
      SELECT
        count() as pageviews,
        count(DISTINCT distinct_id) as unique_users
      FROM events
      WHERE
        event = '$pageview'
        AND properties.$current_url LIKE '${urlLikeClause}'
        AND timestamp >= now() - INTERVAL ${intervalDays}
    `;

    try {
      const response = await this.executeHogQLQuery(query);

      const stats: EntryStats = {
        pageviews: 0,
        uniqueUsers: 0,
      };

      if (response.results && response.results.length > 0) {
        const row = response.results[0];
        stats.pageviews = Number(row[0]) || 0;
        stats.uniqueUsers = Number(row[1]) || 0;
      }

      this.setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      if (error instanceof PostHogApiError) {
        throw error;
      }
      throw new PostHogApiError(
        `Failed to fetch entry stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Fetches daily statistics for the specified date range
   *
   * @param slug - The entry's slug field value
   * @param urlPattern - The URL pattern from configuration
   * @param dateRange - The date range to query (default: 'last7d')
   * @returns Array of daily stats with date, pageviews, and unique users
   */
  async getDailyStats(
    slug: string,
    urlPattern: string,
    dateRange: DateRangeType = 'last7d'
  ): Promise<DailyStats[]> {
    const cacheKey = this.getCacheKey('dailyStats', slug, urlPattern, dateRange);
    const cached = this.getFromCache<DailyStats[]>(cacheKey);
    if (cached) return cached;

    const urlLikeClause = this.buildUrlLikeClause(urlPattern, slug);
    const { days, interval } = DATE_RANGE_OPTIONS[dateRange];

    const query = `
      SELECT
        toDate(timestamp) as date,
        count() as pageviews,
        count(DISTINCT distinct_id) as unique_users
      FROM events
      WHERE
        event = '$pageview'
        AND properties.$current_url LIKE '${urlLikeClause}'
        AND timestamp >= now() - INTERVAL ${interval}
      GROUP BY date
      ORDER BY date ASC
    `;

    try {
      const response = await this.executeHogQLQuery(query);

      const dailyStats: DailyStats[] = [];

      // Initialize all days with zero values
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dailyStats.push({
          date: date.toISOString().split('T')[0],
          pageviews: 0,
          uniqueUsers: 0,
        });
      }

      // Fill in actual data
      if (response.results) {
        for (const row of response.results) {
          const dateStr = String(row[0]);
          const existing = dailyStats.find((d) => d.date === dateStr);
          if (existing) {
            existing.pageviews = Number(row[1]) || 0;
            existing.uniqueUsers = Number(row[2]) || 0;
          }
        }
      }

      this.setCache(cacheKey, dailyStats);
      return dailyStats;
    } catch (error) {
      if (error instanceof PostHogApiError) {
        throw error;
      }
      throw new PostHogApiError(
        `Failed to fetch daily stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  // ==========================================================================
  // Public: Session Recordings
  // ==========================================================================

  /**
   * Fetches recent session recordings that visited the entry's page
   * Uses HogQL to query session_replay_events for reliability with Personal API Key
   *
   * @param slug - The entry's slug field value
   * @param urlPattern - The URL pattern from configuration
   * @param limit - Maximum number of recordings to return (default: 5)
   * @returns Array of session recordings with metadata
   */
  async getRecentRecordings(
    slug: string,
    urlPattern: string,
    limit: number = 5
  ): Promise<SessionRecording[]> {
    const cacheKey = this.getCacheKey('recordings', slug, urlPattern, String(limit));
    const cached = this.getFromCache<SessionRecording[]>(cacheKey);
    if (cached) return cached;

    const urlLikeClause = this.buildUrlLikeClause(urlPattern, slug);

    // Use HogQL to find session recordings that include pageviews to this URL
    // This approach works reliably with Personal API Key authentication
    const query = `
      SELECT DISTINCT
        e.properties.$session_id as session_id,
        e.distinct_id,
        min(e.timestamp) as first_pageview,
        max(e.timestamp) as last_pageview,
        dateDiff('second', min(e.timestamp), max(e.timestamp)) as duration_seconds
      FROM events e
      WHERE
        e.event = '$pageview'
        AND e.properties.$current_url LIKE '${urlLikeClause}'
        AND e.properties.$session_id IS NOT NULL
        AND e.timestamp >= now() - INTERVAL 30 DAY
      GROUP BY e.properties.$session_id, e.distinct_id
      HAVING duration_seconds > 0
      ORDER BY first_pageview DESC
      LIMIT ${limit}
    `;

    try {
      const response = await this.executeHogQLQuery(query);

      const recordings: SessionRecording[] = [];

      if (response.results) {
        for (const row of response.results) {
          const sessionId = String(row[0]);
          if (sessionId && sessionId !== 'null') {
            recordings.push({
              id: sessionId,
              distinctId: this.truncateDistinctId(String(row[1])),
              duration: Math.max(Number(row[4]) || 0, 1), // At least 1 second
              startTime: String(row[2]),
              recordingUrl: `${this.baseUrl}/project/${this.projectId}/replay/${sessionId}`,
            });
          }
        }
      }

      this.setCache(cacheKey, recordings);
      return recordings;
    } catch (error) {
      // Session recordings might fail if not enabled - return empty array
      console.warn('Failed to fetch session recordings:', error);
      return [];
    }
  }

  // ==========================================================================
  // Private: Utility Methods
  // ==========================================================================

  /**
   * Truncates a distinct_id for display purposes (privacy)
   */
  private truncateDistinctId(distinctId: string): string {
    if (distinctId.length <= 12) return distinctId;
    return `${distinctId.slice(0, 6)}...${distinctId.slice(-4)}`;
  }

  // ==========================================================================
  // Public: Deep Link Generation
  // ==========================================================================

  /**
   * Generates a PostHog deep link to view insights for a specific URL
   *
   * @param slug - The entry's slug field value
   * @param urlPattern - The URL pattern from configuration
   * @param dateRange - The date range for the insight
   * @returns URL to PostHog insights page with pre-filled filters
   */
  getInsightsDeepLink(
    slug: string,
    urlPattern: string,
    dateRange: DateRangeType = 'last7d'
  ): string {
    const urlPath = this.buildUrlLikeClause(urlPattern, slug).replace(/%/g, '');
    const { days } = DATE_RANGE_OPTIONS[dateRange];

    // Build PostHog insights URL with filters
    const filters = {
      insight: 'TRENDS',
      events: [
        {
          id: '$pageview',
          name: '$pageview',
          type: 'events',
          properties: [
            {
              key: '$current_url',
              value: urlPath,
              operator: 'icontains',
              type: 'event',
            },
          ],
        },
      ],
      date_from: `-${days}d`,
    };

    const encodedFilters = encodeURIComponent(JSON.stringify(filters));
    return `${this.baseUrl}/project/${this.projectId}/insights/new?filters=${encodedFilters}`;
  }

  /**
   * Generates a PostHog deep link to view session recordings for a specific URL
   *
   * @param slug - The entry's slug field value
   * @param urlPattern - The URL pattern from configuration
   * @returns URL to PostHog session recordings page with pre-filled filters
   */
  getRecordingsDeepLink(slug: string, urlPattern: string): string {
    const urlPath = this.buildUrlLikeClause(urlPattern, slug).replace(/%/g, '');

    // Build PostHog recordings URL with filters
    const filters = {
      events: [
        {
          id: '$pageview',
          type: 'events',
          name: '$pageview',
          properties: [
            {
              key: '$current_url',
              type: 'event',
              value: urlPath,
              operator: 'icontains',
            },
          ],
        },
      ],
    };

    const encodedFilters = encodeURIComponent(JSON.stringify(filters));
    return `${this.baseUrl}/project/${this.projectId}/replay?filters=${encodedFilters}`;
  }

  // ==========================================================================
  // Public: Cache Management
  // ==========================================================================

  /**
   * Clears all cached data for this project
   */
  clearCache(): void {
    const keysToRemove: string[] = [];

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(`${CACHE_PREFIX}${this.projectId}_`)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  }
}

// ============================================================================
// Custom Error Class
// ============================================================================

export class PostHogApiError extends Error {
  readonly status: number;
  readonly details: string;

  constructor(message: string, status: number, details?: string) {
    super(message);
    this.name = 'PostHogApiError';
    this.status = status;
    this.details = details || message;
  }

  /**
   * Returns true if this is an authentication error
   */
  isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /**
   * Returns true if this is a rate limiting error
   */
  isRateLimited(): boolean {
    return this.status === 429;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates a new PostHogClient instance from app installation parameters
 */
export function createPostHogClient(params: {
  personalApiKey?: string;
  projectId?: string;
  posthogHost?: string;
}): PostHogClient {
  if (!params.personalApiKey || !params.projectId || !params.posthogHost) {
    throw new Error('PostHog app is not configured. Please complete the configuration.');
  }

  return new PostHogClient({
    personalApiKey: params.personalApiKey,
    projectId: params.projectId,
    posthogHost: params.posthogHost,
  });
}
