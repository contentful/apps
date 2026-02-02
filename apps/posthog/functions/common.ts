/**
 * Shared utilities for PostHog App Functions
 */

// ============================================================================
// Types
// ============================================================================

export interface PostHogInstallationParams {
  personalApiKey?: string;
  projectApiKey?: string;
  projectId?: string;
  posthogHost?: string;
  urlMappings?: Array<{
    contentTypeId: string;
    urlPattern: string;
  }>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// PostHog Host Utilities
// ============================================================================

/**
 * Normalize the PostHog host URL
 */
export function normalizeHost(host: string): string {
  // Remove trailing slash
  let normalized = host.replace(/\/$/, '');

  // Add https if no protocol
  if (!normalized.startsWith('http')) {
    normalized = `https://${normalized}`;
  }

  return normalized;
}

// ============================================================================
// Response Helpers
// ============================================================================

export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function errorResponse(code: string, message: string): ApiResponse {
  return {
    success: false,
    error: { code, message },
  };
}

// ============================================================================
// PostHog API Request
// ============================================================================

export async function postHogRequest<T>(
  host: string,
  apiKey: string,
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
  } = {}
): Promise<T> {
  const { method = 'GET', body } = options;
  const baseUrl = normalizeHost(host);
  const url = `${baseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PATCH')) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new PostHogApiError(response.status, errorData);
  }

  return response.json() as Promise<T>;
}

// ============================================================================
// Error Handling
// ============================================================================

export class PostHogApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, data: Record<string, unknown>) {
    const message = (data.detail as string) || (data.message as string) || 'PostHog API error';
    super(message);
    this.name = 'PostHogApiError';
    this.status = status;
    this.code = mapStatusToErrorCode(status);
  }
}

function mapStatusToErrorCode(status: number): string {
  switch (status) {
    case 401:
      return 'INVALID_API_KEY';
    case 403:
      return 'PERMISSION_DENIED';
    case 404:
      return 'NOT_FOUND';
    case 429:
      return 'RATE_LIMIT_EXCEEDED';
    default:
      return 'UNKNOWN_ERROR';
  }
}

export function handleError(error: unknown): ApiResponse {
  if (error instanceof PostHogApiError) {
    return errorResponse(error.code, error.message);
  }

  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  return errorResponse('UNKNOWN_ERROR', message);
}

// ============================================================================
// Parameter Validation
// ============================================================================

export function validateInstallationParams(
  params: PostHogInstallationParams | undefined
):
  | {
      valid: true;
      params: Required<
        Pick<PostHogInstallationParams, 'personalApiKey' | 'projectId' | 'posthogHost'>
      >;
    }
  | { valid: false; error: ApiResponse } {
  if (!params?.personalApiKey) {
    return {
      valid: false,
      error: errorResponse('NOT_CONFIGURED', 'Personal API Key is not configured'),
    };
  }

  if (!params?.projectId) {
    return {
      valid: false,
      error: errorResponse('NOT_CONFIGURED', 'Project ID is not configured'),
    };
  }

  if (!params?.posthogHost) {
    return {
      valid: false,
      error: errorResponse('NOT_CONFIGURED', 'PostHog Host is not configured'),
    };
  }

  return {
    valid: true,
    params: {
      personalApiKey: params.personalApiKey,
      projectId: params.projectId,
      posthogHost: params.posthogHost,
    },
  };
}
