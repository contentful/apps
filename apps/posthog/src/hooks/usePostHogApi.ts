/**
 * usePostHogApi Hook
 *
 * Provides methods to invoke PostHog App Actions and handle responses.
 * Used by Sidebar components to fetch analytics, recordings, and feature flags.
 *
 * Features:
 * - Rate limit handling with exponential backoff
 * - Response caching with TTL
 */

import { useCallback, useRef } from 'react';
import { useSDK, useCMA } from '@contentful/react-apps-toolkit';
import { SidebarAppSDK } from '@contentful/app-sdk';
import type {
  AnalyticsMetrics,
  DateRange,
  SessionRecording,
  FeatureFlag,
  ApiResponse,
} from '../types';

// ============================================================================
// Constants
// ============================================================================

/** Cache TTL in milliseconds (5 minutes) */
const CACHE_TTL_MS = 5 * 60 * 1000;

/** Maximum retry attempts for rate-limited requests */
const MAX_RETRIES = 3;

/** Base delay for exponential backoff (1 second) */
const BASE_RETRY_DELAY_MS = 1000;

// ============================================================================
// Types
// ============================================================================

interface CacheEntry<T> {
  data: ApiResponse<T>;
  timestamp: number;
}

interface UsePostHogApiResult {
  /**
   * Query analytics metrics for a specific page URL
   */
  queryAnalytics: (pageUrl: string, dateRange: DateRange) => Promise<ApiResponse<AnalyticsMetrics>>;

  /**
   * List session recordings for a specific page URL
   */
  listRecordings: (
    pageUrl: string,
    limit?: number
  ) => Promise<ApiResponse<{ recordings: SessionRecording[]; hasMore: boolean }>>;

  /**
   * List all feature flags in the project
   */
  listFeatureFlags: () => Promise<ApiResponse<{ flags: FeatureFlag[] }>>;

  /**
   * Toggle a feature flag's active status
   */
  toggleFeatureFlag: (
    flagId: number,
    active: boolean
  ) => Promise<ApiResponse<{ flag: FeatureFlag }>>;

  /**
   * Clear the response cache
   */
  clearCache: () => void;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a cache key from action ID and parameters
 */
function getCacheKey(actionId: string, parameters: Record<string, unknown>): string {
  return `${actionId}:${JSON.stringify(parameters)}`;
}

/**
 * Check if a cache entry is still valid
 */
function isCacheValid<T>(entry: CacheEntry<T> | undefined): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL_MS;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function usePostHogApi(): UsePostHogApiResult {
  const sdk = useSDK<SidebarAppSDK>();
  const cma = useCMA();

  // Response cache (persists across renders but not component remounts)
  const cacheRef = useRef<Map<string, CacheEntry<unknown>>>(new Map());

  /**
   * Clear all cached responses
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  /**
   * Generic helper to invoke an App Action with retry logic and caching
   */
  const invokeAction = useCallback(
    async <T>(
      actionId: string,
      parameters: Record<string, unknown>,
      options: { useCache?: boolean; invalidateCache?: boolean } = {}
    ): Promise<ApiResponse<T>> => {
      const { useCache = true, invalidateCache = false } = options;
      const cacheKey = getCacheKey(actionId, parameters);

      // Check cache first (unless invalidating)
      if (useCache && !invalidateCache) {
        const cached = cacheRef.current.get(cacheKey) as CacheEntry<T> | undefined;
        if (cached && isCacheValid(cached)) {
          return cached.data as ApiResponse<T>;
        }
      }

      // Retry logic with exponential backoff
      let lastError: Error | null = null;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const response = await cma.appActionCall.createWithResponse(
            {
              spaceId: sdk.ids.space,
              environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
              appDefinitionId: sdk.ids.app!,
              appActionId: actionId,
            },
            { parameters }
          );

          // Parse the response body
          const result = JSON.parse(response.response.body) as ApiResponse<T>;

          // Check for rate limit error in response
          if (!result.success && result.error?.code === 'RATE_LIMIT_EXCEEDED') {
            if (attempt < MAX_RETRIES) {
              const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
              await sleep(delay);
              continue;
            }
          }

          // Cache successful responses
          if (result.success && useCache) {
            cacheRef.current.set(cacheKey, {
              data: result,
              timestamp: Date.now(),
            });
          }

          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');

          // Check if it's a rate limit error (429 status)
          const isRateLimited =
            lastError.message.includes('429') || lastError.message.includes('rate limit');

          if (isRateLimited && attempt < MAX_RETRIES) {
            const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
            await sleep(delay);
            continue;
          }

          // Don't retry non-rate-limit errors
          if (!isRateLimited) {
            break;
          }
        }
      }

      // All retries failed
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: lastError?.message || 'Failed to invoke App Action after retries',
        },
      };
    },
    [cma, sdk.ids]
  );

  /**
   * Query analytics metrics for a specific page URL
   */
  const queryAnalytics = useCallback(
    async (pageUrl: string, dateRange: DateRange): Promise<ApiResponse<AnalyticsMetrics>> => {
      return invokeAction<AnalyticsMetrics>('queryAnalytics', {
        pageUrl,
        dateRange,
      });
    },
    [invokeAction]
  );

  /**
   * List session recordings for a specific page URL
   */
  const listRecordings = useCallback(
    async (
      pageUrl: string,
      limit = 10
    ): Promise<ApiResponse<{ recordings: SessionRecording[]; hasMore: boolean }>> => {
      return invokeAction<{ recordings: SessionRecording[]; hasMore: boolean }>('listRecordings', {
        pageUrl,
        limit,
      });
    },
    [invokeAction]
  );

  /**
   * List all feature flags in the project
   */
  const listFeatureFlags = useCallback(async (): Promise<ApiResponse<{ flags: FeatureFlag[] }>> => {
    return invokeAction<{ flags: FeatureFlag[] }>('listFeatureFlags', {});
  }, [invokeAction]);

  /**
   * Toggle a feature flag's active status
   * Note: This invalidates the cache to ensure fresh data on next fetch
   */
  const toggleFeatureFlag = useCallback(
    async (flagId: number, active: boolean): Promise<ApiResponse<{ flag: FeatureFlag }>> => {
      const result = await invokeAction<{ flag: FeatureFlag }>(
        'toggleFeatureFlag',
        { flagId, active },
        { useCache: false }
      );

      // Invalidate the flags list cache after toggling
      if (result.success) {
        const flagsListCacheKey = 'listFeatureFlags:{}';
        cacheRef.current.delete(flagsListCacheKey);
      }

      return result;
    },
    [invokeAction]
  );

  return {
    queryAnalytics,
    listRecordings,
    listFeatureFlags,
    toggleFeatureFlag,
    clearCache,
  };
}
