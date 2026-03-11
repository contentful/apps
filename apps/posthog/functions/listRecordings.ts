/**
 * List Recordings App Function
 *
 * Fetches session recordings from PostHog filtered by page URL.
 * Returns recording metadata with links to the PostHog dashboard.
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
  normalizeHost,
} from './common';

// ============================================================================
// Types
// ============================================================================

interface ListRecordingsParams {
  pageUrl: string;
  limit?: number;
}

interface PostHogRecording {
  id: string;
  distinct_id: string;
  start_time: string;
  end_time: string;
  recording_duration: number;
  active_seconds: number;
}

interface PostHogRecordingsResponse {
  results: PostHogRecording[];
  has_next: boolean;
  count?: number;
}

interface SessionRecording {
  id: string;
  distinctId: string;
  startTime: string;
  endTime: string;
  duration: number;
  activeSeconds: number;
  viewUrl: string;
}

interface ListRecordingsResult {
  recordings: SessionRecording[];
  hasMore: boolean;
  totalCount: number;
}

// ============================================================================
// Handler
// ============================================================================

export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppActionCall,
  ListRecordingsParams
> = async (
  event: AppActionRequest<'Custom', ListRecordingsParams>,
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
    const { pageUrl, limit = 10 } = event.body;

    if (!pageUrl) {
      return {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Page URL is required',
        },
      };
    }

    // Build filter for recordings that visited this URL
    const properties = JSON.stringify([
      {
        key: '$current_url',
        value: pageUrl,
        operator: 'icontains',
        type: 'event',
      },
    ]);

    const response = await postHogRequest<PostHogRecordingsResponse>(
      posthogHost,
      personalApiKey,
      `/api/projects/${projectId}/session_recordings/?properties=${encodeURIComponent(
        properties
      )}&limit=${limit}`
    );

    const baseUrl = normalizeHost(posthogHost);

    const recordings: SessionRecording[] = (response.results || []).map((rec) => ({
      id: rec.id,
      distinctId: truncateDistinctId(rec.distinct_id),
      startTime: rec.start_time,
      endTime: rec.end_time,
      duration: rec.recording_duration || 0,
      activeSeconds: rec.active_seconds || 0,
      viewUrl: `${baseUrl}/project/${projectId}/replay/${rec.id}`,
    }));

    return successResponse<ListRecordingsResult>({
      recordings,
      hasMore: response.has_next || false,
      totalCount: response.count || recordings.length,
    });
  } catch (error) {
    return handleError(error);
  }
};

// ============================================================================
// Helpers
// ============================================================================

function truncateDistinctId(distinctId: string): string {
  if (!distinctId || distinctId.length <= 12) return distinctId || '';
  return `${distinctId.slice(0, 6)}...${distinctId.slice(-4)}`;
}
