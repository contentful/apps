import { useCallback, useEffect, useState } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  FormControl,
  Heading,
  Paragraph,
  TextInput,
  Spinner,
  TextLink,
  Subheading,
} from '@contentful/f36-components';
import { ArrowSquareOutIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import tokens from '@contentful/f36-tokens';

export interface AppInstallationParameters {
  openAiApiKey?: string;
  openAiApiKeyLength?: number;
  openAiApiKeySuffix?: string;
}

const VISIBLE_SUFFIX_LENGTH = 4;

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [openAiApiKeyInput, setOpenAiApiKeyInput] = useState<string>('');
  const [openAiApiKeyObfuscatedDisplay, setOpenAiApiKeyObfuscatedDisplay] = useState<string>('');
  const [openAiApiKeyIsValid, setOpenAiApiKeyIsValid] = useState<boolean>(true);
  const [isValidatingOpenAiApiKey, setIsValidatingOpenAiApiKey] = useState<boolean>(false);

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();
    const openAiApiKey = openAiApiKeyInput.trim();
    const parametersToSave: Record<string, string | number> = {};
    // Only persist apiKey if user actually typed a new one (not the obfuscated placeholder)
    if (openAiApiKey && openAiApiKey !== openAiApiKeyObfuscatedDisplay) {
      parametersToSave.openAiApiKey = openAiApiKey;
      parametersToSave.openAiApiKeyLength = openAiApiKey.length;
      parametersToSave.openAiApiKeySuffix = openAiApiKey.slice(-VISIBLE_SUFFIX_LENGTH);
    }
    return {
      parameters: parametersToSave,
      targetState: currentState,
    };
  }, [sdk, openAiApiKeyInput, openAiApiKeyObfuscatedDisplay]);

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
        const {
          openAiApiKey: apiKey,
          openAiApiKeyLength: apiKeyLength,
          openAiApiKeySuffix: apiKeySuffix,
        } = currentParameters;
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
          setOpenAiApiKeyObfuscatedDisplay(masked);
          setOpenAiApiKeyInput(masked);
        }
      }
      sdk.app.setReady();
    })();
  }, [sdk]);

  const validateApiKey = useCallback(
    async (value: string) => {
      const token = value.trim();
      if (token === openAiApiKeyObfuscatedDisplay) {
        setOpenAiApiKeyIsValid(true);
        return true;
      }
      if (token.length === 0) {
        setOpenAiApiKeyIsValid(true);
        return true;
      }
      try {
        setIsValidatingOpenAiApiKey(true);
        return true;
      } catch (e) {
        setOpenAiApiKeyIsValid(false);
        return false;
      } finally {
        setIsValidatingOpenAiApiKey(false);
      }
    },
    [openAiApiKeyObfuscatedDisplay, sdk]
  );

  return (
    <Box padding="spacingM" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <Box padding="spacingXl">
        <Heading as="h2" marginBottom="spacingM">
          Set up Google Drive app
        </Heading>
        <Paragraph marginBottom="spacingXl">
          Connect Google Drive to Contentful to seamlessly connect content, eliminating copy-paste,
          reducing errors, and speeding up your publishing workflow.
        </Paragraph>
        <Subheading marginBottom="spacing2Xs">Configure access</Subheading>
        <Paragraph marginBottom="spacingXl">To use this app you need an OpenAPI account.</Paragraph>
        <FormControl>
          <FormControl.Label isRequired>OpenAI API key</FormControl.Label>
          <TextInput
            id="apiKey"
            name="apiKey"
            value={openAiApiKeyInput}
            placeholder="sk-xxxx"
            onChange={(e) => setOpenAiApiKeyInput(e.target.value)}
            onBlur={() => void validateApiKey(openAiApiKeyInput)}
            isInvalid={!openAiApiKeyIsValid}
            style={{ flex: 1, color: tokens.gray700 }}
          />
          <FormControl.HelpText>
            Find your OpenAI API key{' '}
            <TextLink
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer">
              <Box
                as="span"
                display="inline-flex"
                style={{ fontWeight: 'normal', alignItems: 'center', gap: 4 }}>
                here
                <ArrowSquareOutIcon size="small" aria-hidden="true" />
              </Box>
            </TextLink>
          </FormControl.HelpText>
          {!openAiApiKeyIsValid && (
            <FormControl.ValidationMessage>
              Unable to validate the OpenAI API key. Please check and try again.
            </FormControl.ValidationMessage>
          )}
          {isValidatingOpenAiApiKey && (
            <Paragraph marginTop="spacingS">
              Validating key
              <Spinner size="small" />
            </Paragraph>
          )}
        </FormControl>
      </Box>
    </Box>
  );
};

export default ConfigScreen;
