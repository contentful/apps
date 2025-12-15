import { useState, useCallback } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { validateApiKeyFormat } from '../utils/openaiValidation';

export interface AppInstallationParameters {
  openAiApiKey?: string;
  openAiApiKeyLength?: number;
  openAiApiKeySuffix?: string;
}

export const VISIBLE_SUFFIX_LENGTH = 4;

interface UseApiKeyStateReturn {
  apiKeyInput: string;
  obfuscatedDisplay: string;
  onApiKeyInputChange: (value: string, onValidationChange?: (value: string) => void) => void;
  initializeFromParameters: () => Promise<void>;
}

/**
 * Hook to manage API key input state and obfuscated display.
 * Handles loading existing parameters and creating masked display strings for saved keys.
 */
export const useApiKeyState = (sdk: ConfigAppSDK): UseApiKeyStateReturn => {
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [obfuscatedDisplay, setObfuscatedDisplay] = useState<string>('');

  const initializeFromParameters = useCallback(async () => {
    const currentParameters = (await sdk.app.getParameters()) as AppInstallationParameters | null;

    if (!currentParameters) {
      setApiKeyInput('');
      setObfuscatedDisplay('');
      return;
    }

    const { openAiApiKey, openAiApiKeyLength, openAiApiKeySuffix } = currentParameters;

    const hasMeta =
      typeof openAiApiKeyLength === 'number' &&
      typeof openAiApiKeySuffix === 'string' &&
      openAiApiKeyLength > 0;

    if (!openAiApiKey && !hasMeta) {
      setApiKeyInput('');
      setObfuscatedDisplay('');
      return;
    }

    const totalLength = hasMeta ? openAiApiKeyLength : openAiApiKey!.length;
    const visibleSuffix = (hasMeta ? openAiApiKeySuffix : openAiApiKey!).slice(
      -VISIBLE_SUFFIX_LENGTH
    );

    const maskedLength = Math.max(0, totalLength - VISIBLE_SUFFIX_LENGTH);
    const masked = '•'.repeat(maskedLength) + visibleSuffix;

    setObfuscatedDisplay(masked);
    setApiKeyInput(masked);
  }, [sdk]);

  const onApiKeyInputChange = useCallback(
    (newValue: string, onValidationChange?: (value: string) => void) => {
      if (
        apiKeyInput === obfuscatedDisplay &&
        obfuscatedDisplay.length > 0 &&
        newValue !== obfuscatedDisplay
      ) {
        const trimmed = newValue.trim();
        const formatResult = validateApiKeyFormat(trimmed);
        if (formatResult.isValid) {
          setApiKeyInput(newValue);
          onValidationChange?.(newValue);
          return;
        }
        setApiKeyInput('');
        return;
      }

      if (newValue.includes('•') && newValue !== obfuscatedDisplay) {
        setApiKeyInput('');
        return;
      }

      setApiKeyInput(newValue);
      onValidationChange?.(newValue);
    },
    [apiKeyInput, obfuscatedDisplay]
  );

  return {
    apiKeyInput,
    obfuscatedDisplay,
    onApiKeyInputChange,
    initializeFromParameters,
  };
};
