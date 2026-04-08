/**
 * Query Analytics App Function
 *
 * Queries PostHog for page view metrics using HogQL.
 * Returns page views, unique visitors, and average session duration.
 */

import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import {
  PostHogInstallationParams,
  postHogRequest,
  successResponse,
  handleError,
  validateInstallationParams,
} from './common';

// ============================================================================
// Types
// ============================================================================

type DateRange = 'today' | 'last7days' | 'last30days';

interface QueryAnalyticsParams {
  pageUrl: string;
  dateRange: DateRange;
}

interface HogQLResponse {
  results: unknown[][];
  columns: string[];
  types: string[];
  error?: string;
}

interface AnalyticsMetrics {
  pageViews: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
  dateRange: DateRange;
  pageUrl: string;
}

// ============================================================================
// Date Range Helpers
// ============================================================================

function getDateFilter(dateRange: DateRange): string {
  switch (dateRange) {
    case 'today':
      return 'now() - INTERVAL 1 DAY';
    case 'last7days':
      return 'now() - INTERVAL 7 DAY';
    case 'last30days':
      return 'now() - INTERVAL 30 DAY';
    default:
      return 'now() - INTERVAL 7 DAY';
  }
}

function buildUrlLikeClause(pageUrl: string): string {
  // Extract path from URL for flexible matching
  try {
    const url = new URL(pageUrl);
    return `%${url.pathname}%`;
  } catch {
    // If not a valid URL, use as-is with wildcards
    return `%${pageUrl}%`;
  }
}

// ============================================================================
// Handler
// ============================================================================

export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppActionCall,
  QueryAnalyticsParams
> = async (
  event: AppActionRequest<'Custom', QueryAnalyticsParams>,
  context: FunctionEventContext
) => {
  try {
    // Validate installation parameters
    const validation = validateInstallationParams(
      context.appInstallationParameters as PostHogInstallationParams
    );

    if (!validation.valid) {
      return validation.error;
    }

    const { personalApiKey, projectId, posthogHost } = validation.params;
    const { pageUrl, dateRange } = event.body;

    if (!pageUrl) {
      return {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Page URL is required',
        },
      };
    }

    const urlLikeClause = buildUrlLikeClause(pageUrl);
    const dateFilter = getDateFilter(dateRange || 'last7days');

    // HogQL query for analytics metrics
    const query = `
      SELECT
        count() as pageviews,
        count(DISTINCT person_id) as unique_visitors,
        avg(session.$session_duration) as avg_session_duration
      FROM events
      WHERE
        event = '$pageview'
        AND properties.$current_url LIKE '${urlLikeClause}'
        AND timestamp >= ${dateFilter}
    `;

    const response = await postHogRequest<HogQLResponse>(
      posthogHost,
      personalApiKey,
      `/api/projects/${projectId}/query/`,
      {
        method: 'POST',
        body: {
          query: {
            kind: 'HogQLQuery',
            query,
          },
        },
      }
    );

    if (response.error) {
      return {
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: response.error,
        },
      };
    }

    // Parse results
    const metrics: AnalyticsMetrics = {
      pageViews: 0,
      uniqueVisitors: 0,
      avgSessionDuration: 0,
      dateRange: dateRange || 'last7days',
      pageUrl,
    };

    if (response.results && response.results.length > 0) {
      const row = response.results[0];
      metrics.pageViews = Number(row[0]) || 0;
      metrics.uniqueVisitors = Number(row[1]) || 0;
      metrics.avgSessionDuration = Number(row[2]) || 0;
    }

    return successResponse(metrics);
  } catch (error) {
    return handleError(error);
  }
};
