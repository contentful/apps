/**
 * validateConnection App Function
 *
 * Tests PostHog API credentials by fetching project information.
 * Used during app configuration to verify credentials before saving.
 */

import {
  postHogRequest,
  handleError,
  successResponse,
  normalizeHost,
  type ApiResponse,
} from './common';

// ============================================================================
// Types
// ============================================================================

interface ValidateConnectionParams {
  apiKey: string;
  projectId: string;
  host: string;
}

interface PostHogProject {
  id: number;
  name: string;
  organization: string;
  timezone: string;
}

interface ValidateConnectionResult {
  projectName: string;
  organizationName: string;
}

// ============================================================================
// Handler
// ============================================================================

interface AppActionRequest {
  body: {
    parameters: ValidateConnectionParams;
  };
}

export const handler = async (
  request: AppActionRequest
): Promise<ApiResponse<ValidateConnectionResult>> => {
  const { parameters } = request.body;

  // Validate required parameters
  if (!parameters.apiKey) {
    return {
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'API Key is required' },
    };
  }

  if (!parameters.projectId) {
    return {
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'Project ID is required' },
    };
  }

  if (!parameters.host) {
    return {
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'Host is required' },
    };
  }

  try {
    // Fetch project details to validate credentials
    const project = await postHogRequest<PostHogProject>(
      normalizeHost(parameters.host),
      parameters.apiKey,
      `/api/projects/${parameters.projectId}/`
    );

    return successResponse({
      projectName: project.name,
      organizationName: project.organization,
    });
  } catch (error) {
    return handleError(error);
  }
};
