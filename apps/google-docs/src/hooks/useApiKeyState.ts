import { useState, useEffect, useCallback } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';

export interface AppInstallationParameters {
  openAiApiKey?: string;
  openAiApiKeyLength?: number;
  openAiApiKeySuffix?: string;
}

const VISIBLE_SUFFIX_LENGTH = 4;

interface UseApiKeyStateReturn {
  apiKeyInput: string;
  obfuscatedDisplay: string;
  setApiKeyInput: (value: string) => void;
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

    const totalLength = hasMeta ? openAiApiKeyLength : openAiApiKey?.length || 8;
    const suffix = hasMeta ? openAiApiKeySuffix : openAiApiKey?.slice(-VISIBLE_SUFFIX_LENGTH) || '';
    const visibleSuffix = suffix.slice(-VISIBLE_SUFFIX_LENGTH);
    const maskedLength = Math.max(0, totalLength - visibleSuffix.length);
    const masked = '•'.repeat(maskedLength) + visibleSuffix;

    setObfuscatedDisplay(masked);
    setApiKeyInput(masked);
  }, [sdk]);

  return {
    apiKeyInput,
    obfuscatedDisplay,
    setApiKeyInput,
    initializeFromParameters,
  };
};
