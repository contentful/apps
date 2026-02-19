import { useCallback } from 'react';
import { ConfigAppSDK, AppState } from '@contentful/app-sdk';
import { AppInstallationParameters, VISIBLE_SUFFIX_LENGTH } from './useApiKeyState';

interface HandleConfigureParams {
  apiKeyInput: string;
  obfuscatedDisplay: string;
  isValidating: boolean;
  validateApiKey: (value: string, skipApiValidation?: boolean) => Promise<boolean>;
}

interface UseAppConfigurationReturn {
  handleConfigure: (params: HandleConfigureParams) => Promise<
    | false
    | {
        parameters: AppInstallationParameters;
        targetState: AppState | null | undefined;
      }
  >;
}

const createApiKeyParameters = (apiKey: string): AppInstallationParameters => ({
  openAiApiKey: apiKey,
  openAiApiKeyLength: apiKey.length,
  openAiApiKeySuffix: apiKey.slice(-VISIBLE_SUFFIX_LENGTH),
});

/**
 * Hook to handle app configuration and parameter saving.
 * Validates API key before saving and handles obfuscated key preservation.
 */
export const useAppConfiguration = (sdk: ConfigAppSDK): UseAppConfigurationReturn => {
  const handleConfigure = useCallback(
    async ({
      apiKeyInput,
      obfuscatedDisplay,
      isValidating,
      validateApiKey,
    }: HandleConfigureParams) => {
      if (isValidating) {
        return false;
      }

      const currentState = await sdk.app.getCurrentState();
      const openAiApiKey = apiKeyInput.trim();

      const isValid = await validateApiKey(openAiApiKey, false);
      if (!isValid) {
        return false;
      }

      let parametersToSave: AppInstallationParameters = {};

      if (openAiApiKey && openAiApiKey !== obfuscatedDisplay) {
        parametersToSave = createApiKeyParameters(openAiApiKey);
      } else if (openAiApiKey === obfuscatedDisplay && openAiApiKey.length > 0) {
        const currentParameters =
          (await sdk.app.getParameters()) as AppInstallationParameters | null;
        if (currentParameters?.openAiApiKey) {
          parametersToSave = createApiKeyParameters(currentParameters.openAiApiKey);
        }
      }

      return {
        parameters: parametersToSave,
        targetState: currentState,
      };
    },
    [sdk]
  );

  return {
    handleConfigure,
  };
};
