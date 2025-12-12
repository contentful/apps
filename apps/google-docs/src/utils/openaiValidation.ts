const OPENAI_MODELS_URL = 'https://api.openai.com/v1/models';
const VALIDATION_TIMEOUT = 10000;

export const OPENAI_API_KEY_PREFIX = 'sk-';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  errorCode?: number;
  apiUnavailable?: boolean;
}

/**
 * Validates an OpenAI API key by calling the OpenAI models endpoint.
 * Falls back to format-only validation if API is unavailable.
 */
export async function validateOpenAiApiKey(
  apiKey: string,
  timeout: number = VALIDATION_TIMEOUT
): Promise<ValidationResult> {
  const token = apiKey.trim();

  if (token.length === 0) {
    return {
      isValid: false,
      error: 'API key is required',
    };
  }

  if (!token.startsWith(OPENAI_API_KEY_PREFIX)) {
    return {
      isValid: false,
      error: `Invalid API key format. Keys must start with "${OPENAI_API_KEY_PREFIX}"`,
    };
  }

  if (token.length < 10) {
    return {
      isValid: false,
      error: 'API key is too short',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(OPENAI_MODELS_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status < 400) {
      return {
        isValid: true,
      };
    }

    if (response.status === 401) {
      return {
        isValid: false,
        error: 'Invalid API key',
        errorCode: 401,
      };
    }

    if (response.status === 429) {
      return {
        isValid: true,
        error:
          'Rate limit exceeded. API key format is valid, but unable to verify with OpenAI at this time.',
        errorCode: 429,
        apiUnavailable: true,
      };
    }

    if (response.status >= 500) {
      return {
        isValid: true,
        error: 'OpenAI service temporarily unavailable. API key format is valid.',
        errorCode: response.status,
        apiUnavailable: true,
      };
    }

    const errorJson = await response.json().catch(() => ({}));
    return {
      isValid: true,
      error:
        errorJson?.error?.message ||
        'Unable to verify API key with OpenAI. Format validation passed.',
      errorCode: response.status,
      apiUnavailable: true,
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        isValid: true,
        error: 'Validation timeout. API key format is valid, but unable to verify with OpenAI.',
        apiUnavailable: true,
      };
    }

    if (error instanceof TypeError) {
      return {
        isValid: true,
        error: 'Network error. API key format is valid, but unable to verify with OpenAI.',
        apiUnavailable: true,
      };
    }

    return {
      isValid: true,
      error: 'Unable to verify API key with OpenAI. Format validation passed.',
      apiUnavailable: true,
    };
  }
}
