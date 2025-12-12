import { useCallback } from 'react';
import { ConfigAppSDK, AppState } from '@contentful/app-sdk';
import { AppInstallationParameters } from './useApiKeyState';

const VISIBLE_SUFFIX_LENGTH = 4;

interface UseAppConfigurationReturn {
  handleConfigure: (
    apiKeyInput: string,
    obfuscatedDisplay: string,
    isValidating: boolean,
    validateApiKey: (value: string, skipApiValidation?: boolean) => Promise<boolean>
  ) => Promise<
    | false
    | {
        parameters: Record<string, string | number>;
        targetState: AppState | null | undefined;
      }
  >;
}

/**
 * Hook to handle app configuration and parameter saving.
 * Validates API key before saving and handles obfuscated key preservation.
 */
export const useAppConfiguration = (sdk: ConfigAppSDK): UseAppConfigurationReturn => {
  const handleConfigure = useCallback(
    async (
      apiKeyInput: string,
      obfuscatedDisplay: string,
      isValidating: boolean,
      validateApiKey: (value: string, skipApiValidation?: boolean) => Promise<boolean>
    ) => {
      if (isValidating) {
        return false;
      }

      const currentState = await sdk.app.getCurrentState();
      const openAiApiKey = apiKeyInput.trim();

      const isValid = await validateApiKey(openAiApiKey, false);
      if (!isValid) {
        return false;
      }

      const parametersToSave: Record<string, string | number> = {};
      if (openAiApiKey && openAiApiKey !== obfuscatedDisplay) {
        parametersToSave.openAiApiKey = openAiApiKey;
        parametersToSave.openAiApiKeyLength = openAiApiKey.length;
        parametersToSave.openAiApiKeySuffix = openAiApiKey.slice(-VISIBLE_SUFFIX_LENGTH);
      } else if (openAiApiKey === obfuscatedDisplay && openAiApiKey.length > 0) {
        const currentParameters =
          (await sdk.app.getParameters()) as AppInstallationParameters | null;
        if (currentParameters?.openAiApiKey) {
          parametersToSave.openAiApiKey = currentParameters.openAiApiKey;
          parametersToSave.openAiApiKeyLength = currentParameters.openAiApiKey.length;
          parametersToSave.openAiApiKeySuffix = currentParameters.openAiApiKey.slice(
            -VISIBLE_SUFFIX_LENGTH
          );
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
