/**
 * usePostHogApi Hook
 *
 * Provides methods to invoke PostHog App Actions and handle responses.
 * Used by Sidebar components to fetch analytics, recordings, and feature flags.
 */

import { useCallback } from 'react';
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
// Types
// ============================================================================

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
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function usePostHogApi(): UsePostHogApiResult {
  const sdk = useSDK<SidebarAppSDK>();
  const cma = useCMA();

  /**
   * Generic helper to invoke an App Action and parse the response
   */
  const invokeAction = useCallback(
    async <T>(actionId: string, parameters: Record<string, unknown>): Promise<ApiResponse<T>> => {
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
        const result = JSON.parse(response.response.body);
        return result as ApiResponse<T>;
      } catch (error) {
        // Handle network or parsing errors
        const message = error instanceof Error ? error.message : 'Failed to invoke App Action';
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message,
          },
        };
      }
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
   */
  const toggleFeatureFlag = useCallback(
    async (flagId: number, active: boolean): Promise<ApiResponse<{ flag: FeatureFlag }>> => {
      return invokeAction<{ flag: FeatureFlag }>('toggleFeatureFlag', {
        flagId,
        active,
      });
    },
    [invokeAction]
  );

  return {
    queryAnalytics,
    listRecordings,
    listFeatureFlags,
    toggleFeatureFlag,
  };
}
