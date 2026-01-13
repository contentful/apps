/**
 * List Feature Flags App Function
 *
 * Fetches all feature flags from the PostHog project.
 * Returns flag metadata including enabled status and rollout percentage.
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

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ListFeatureFlagsParams {
  // No parameters required - lists all flags for the project
}

interface PostHogFeatureFlag {
  id: number;
  key: string;
  name: string;
  active: boolean;
  rollout_percentage: number | null;
  created_at: string;
  created_by: {
    email: string;
  };
}

interface PostHogFlagsResponse {
  results: PostHogFeatureFlag[];
  count: number;
}

interface FeatureFlag {
  id: number;
  key: string;
  name: string;
  active: boolean;
  rolloutPercentage: number | null;
  createdAt: string;
  createdBy: string;
}

interface ListFeatureFlagsResult {
  flags: FeatureFlag[];
  totalCount: number;
}

// ============================================================================
// Handler
// ============================================================================

export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppActionCall,
  ListFeatureFlagsParams
> = async (
  _event: AppActionRequest<'Custom', ListFeatureFlagsParams>,
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

    const response = await postHogRequest<PostHogFlagsResponse>(
      posthogHost,
      personalApiKey,
      `/api/projects/${projectId}/feature_flags/`
    );

    const flags: FeatureFlag[] = (response.results || []).map((flag) => ({
      id: flag.id,
      key: flag.key,
      name: flag.name || flag.key,
      active: flag.active,
      rolloutPercentage: flag.rollout_percentage,
      createdAt: flag.created_at,
      createdBy: flag.created_by?.email || 'Unknown',
    }));

    return successResponse<ListFeatureFlagsResult>({
      flags,
      totalCount: response.count || flags.length,
    });
  } catch (error) {
    return handleError(error);
  }
};
