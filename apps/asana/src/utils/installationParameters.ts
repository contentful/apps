import type { AppInstallationParameters } from '../types';

const parseJsonField = <T>(value: unknown): T | undefined => {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
};

/**
 * `enabledContentTypeIds` is declared as a Symbol (string) installation parameter in the app
 * definition, so the CMA stores it as a JSON string. This normalizes it back into an array
 * regardless of whether the raw value came from a real installation (string) or a test fixture
 * (already an array).
 */
export const parseInstallationParameters = (
  parameters: AppInstallationParameters
): AppInstallationParameters => ({
  ...parameters,
  enabledContentTypeIds:
    parseJsonField<string[]>(parameters.enabledContentTypeIds) ??
    (Array.isArray(parameters.enabledContentTypeIds) ? parameters.enabledContentTypeIds : []),
});
