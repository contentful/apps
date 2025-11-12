import { useCallback, useEffect, useState } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { Box, Form, FormControl, Heading, Paragraph, TextInput } from '@contentful/f36-components';
import { ArrowSquareOutIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';

export interface AppInstallationParameters {
  apiKey?: string;
  apiKeyLength?: number;
  apiKeySuffix?: string;
}

const VISIBLE_SUFFIX_LENGTH = 4;

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [apiKeyObfuscatedDisplay, setApiKeyObfuscatedDisplay] = useState<string>('');
  const [apiKeyIsValid, setApiKeyIsValid] = useState<boolean>(true);
  const [isValidatingApiKey, setIsValidatingApiKey] = useState<boolean>(false);

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();
    const trimmed = apiKeyInput.trim();
    const parametersToSave: Record<string, string | number> = {};
    // Only persist apiKey if user actually typed a new one (not the obfuscated placeholder)
    if (trimmed && trimmed !== apiKeyObfuscatedDisplay) {
      parametersToSave.apiKey = trimmed;
      parametersToSave.apiKeyLength = trimmed.length;
      parametersToSave.apiKeySuffix = trimmed.slice(-VISIBLE_SUFFIX_LENGTH);
    }
    return {
      parameters: parametersToSave,
      targetState: currentState,
    };
  }, [sdk, apiKeyInput, apiKeyObfuscatedDisplay]);

  const onConfigurationCompleted = useCallback((error?: unknown) => {
    if (!error) {
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
    sdk.app.onConfigurationCompleted((error) => onConfigurationCompleted(error));
  }, [sdk, onConfigure, onConfigurationCompleted]);

  useEffect(() => {
    (async () => {
      const currentParameters = (await sdk.app.getParameters()) as
        | (AppInstallationParameters & { apiKey?: string })
        | null;
      if (currentParameters) {
        const { apiKey, apiKeyLength, apiKeySuffix } = currentParameters;
        const hasMeta =
          typeof apiKeyLength === 'number' &&
          typeof apiKeySuffix === 'string' &&
          (apiKeyLength || 0) > 0;
        if (typeof apiKey === 'string' || hasMeta) {
          const totalLength =
            (hasMeta ? (apiKeyLength as number) : (apiKey as string)?.length) || 8;
          const suffix =
            (hasMeta
              ? (apiKeySuffix as string)
              : (apiKey as string)?.slice(-VISIBLE_SUFFIX_LENGTH)) || '';
          const visibleSuffix = suffix.slice(-VISIBLE_SUFFIX_LENGTH);
          const maskedLength = Math.max(0, totalLength - visibleSuffix.length);
          const masked = '•'.repeat(maskedLength) + visibleSuffix;
          setApiKeyObfuscatedDisplay(masked);
          setApiKeyInput(masked);
        }
      }
      sdk.app.setReady();
    })();
  }, [sdk]);

  const validateApiKey = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (trimmed === apiKeyObfuscatedDisplay) {
        setApiKeyIsValid(true);
        return true;
      }
      if (trimmed.length === 0) {
        setApiKeyIsValid(true);
        return true;
      }
      try {
        setIsValidatingApiKey(true);
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${trimmed}`,
          },
        });
        const ok = response.ok;
        setApiKeyIsValid(ok);
        return ok;
      } catch {
        setApiKeyIsValid(false);
        return false;
      } finally {
        setIsValidatingApiKey(false);
      }
    },
    [apiKeyObfuscatedDisplay]
  );

  return (
    <Box style={{ maxWidth: '800px', margin: '64px auto' }}>
      <Box padding="spacingXl">
        <Heading as="h2" marginBottom="spacingM">
          Set up Google Drive app
        </Heading>
        <Paragraph marginBottom="spacingL">
          Connect Google Drive to Contentful to seamlessly connect content, eliminating copy-paste,
          reducing errors, and speeding up your publishing workflow.
        </Paragraph>
        <Form style={{ width: '100%' }}>
          <FormControl style={{ width: '100%' }}>
            <FormControl.Label isRequired>OpenAPI key</FormControl.Label>
            <Box style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <TextInput
                id="apiKey"
                name="apiKey"
                value={apiKeyInput}
                placeholder="sk-xxxx"
                onChange={(e) => setApiKeyInput(e.target.value)}
                onBlur={() => void validateApiKey(apiKeyInput)}
                isInvalid={!apiKeyIsValid}
                style={{ flex: 1 }}
              />
            </Box>
            <Paragraph marginTop="spacingS">
              Find your OpenAPI key{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer">
                here <ArrowSquareOutIcon size="tiny" aria-hidden="true" style={{ marginLeft: 4 }} />
              </a>
              .
            </Paragraph>
            {!apiKeyIsValid && (
              <Paragraph marginTop="spacingS" style={{ color: '#cc2e2e' }}>
                Unable to validate the API key. Please check and try again.
              </Paragraph>
            )}
            {isValidatingApiKey && <Paragraph marginTop="spacingS">Validating key…</Paragraph>}
          </FormControl>
        </Form>
      </Box>
    </Box>
  );
};

export default ConfigScreen;
