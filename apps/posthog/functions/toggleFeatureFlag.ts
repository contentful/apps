/**
 * Toggle Feature Flag App Function
 *
 * Enables or disables a feature flag in PostHog.
 * Returns the updated flag state.
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

interface ToggleFeatureFlagParams {
  flagId: number;
  active: boolean;
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

interface FeatureFlag {
  id: number;
  key: string;
  name: string;
  active: boolean;
  rolloutPercentage: number | null;
  createdAt: string;
  createdBy: string;
}

interface ToggleFeatureFlagResult {
  flag: FeatureFlag;
}

// ============================================================================
// Handler
// ============================================================================

export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppActionCall,
  ToggleFeatureFlagParams
> = async (
  event: AppActionRequest<'Custom', ToggleFeatureFlagParams>,
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
    const { flagId, active } = event.body;

    if (flagId === undefined || flagId === null) {
      return {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Flag ID is required',
        },
      };
    }

    if (active === undefined) {
      return {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Active state is required',
        },
      };
    }

    // Update the feature flag
    const response = await postHogRequest<PostHogFeatureFlag>(
      posthogHost,
      personalApiKey,
      `/api/projects/${projectId}/feature_flags/${flagId}/`,
      {
        method: 'PATCH',
        body: { active },
      }
    );

    const flag: FeatureFlag = {
      id: response.id,
      key: response.key,
      name: response.name || response.key,
      active: response.active,
      rolloutPercentage: response.rollout_percentage,
      createdAt: response.created_at,
      createdBy: response.created_by?.email || 'Unknown',
    };

    return successResponse<ToggleFeatureFlagResult>({ flag });
  } catch (error) {
    return handleError(error);
  }
};
