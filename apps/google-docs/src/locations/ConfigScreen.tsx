import { useCallback, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  FormControl,
  Heading,
  Paragraph,
  TextInput,
  TextLink,
  Subheading,
} from '@contentful/f36-components';
import { ArrowSquareOutIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import tokens from '@contentful/f36-tokens';
import { useApiKeyState, AppInstallationParameters } from '../hooks/useApiKeyState';
import { useApiKeyValidation } from '../hooks/useApiKeyValidation';
import { useAppConfiguration } from '../hooks/useAppConfiguration';
import { ValidationFeedback } from '../components/config/ValidationFeedback';
import { validateApiKeyFormat, OPENAI_API_KEY_PREFIX } from '../utils/openaiValidation';

export type { AppInstallationParameters };

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const { apiKeyInput, obfuscatedDisplay, setApiKeyInput, initializeFromParameters } =
    useApiKeyState(sdk);
  const {
    isValid,
    isValidating,
    validationError,
    apiUnavailable,
    validateApiKey,
    handleInputChange,
    handleFocus,
    handleBlur,
  } = useApiKeyValidation(obfuscatedDisplay);
  const { handleConfigure } = useAppConfiguration(sdk);

  const onConfigure = useCallback(async () => {
    return handleConfigure(apiKeyInput, obfuscatedDisplay, isValidating, validateApiKey);
  }, [apiKeyInput, obfuscatedDisplay, isValidating, validateApiKey, handleConfigure]);

  const onConfigurationCompleted = useCallback((error?: unknown) => {
    if (!error) {
      window.location.reload();
    }
  }, []);

  const handleApiKeyChange = (newValue: string) => {
    if (
      apiKeyInput === obfuscatedDisplay &&
      obfuscatedDisplay.length > 0 &&
      newValue !== obfuscatedDisplay
    ) {
      const trimmed = newValue.trim();
      const formatResult = validateApiKeyFormat(trimmed);
      if (formatResult.isValid) {
        setApiKeyInput(newValue);
        handleInputChange(newValue);
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
    handleInputChange(newValue);
  };

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
    sdk.app.onConfigurationCompleted((error) => onConfigurationCompleted(error));
  }, [sdk, onConfigure, onConfigurationCompleted]);

  useEffect(() => {
    (async () => {
      await initializeFromParameters();
      sdk.app.setReady();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (apiKeyInput && apiKeyInput === obfuscatedDisplay) {
      void validateApiKey(apiKeyInput, true);
    } else if (apiKeyInput === '' && obfuscatedDisplay === '') {
      void validateApiKey('', true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKeyInput, obfuscatedDisplay]);

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
            value={apiKeyInput}
            placeholder={`${OPENAI_API_KEY_PREFIX}xxxx`}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            onFocus={() => handleFocus(apiKeyInput)}
            onBlur={() => handleBlur(apiKeyInput)}
            isInvalid={!isValid}
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
          <ValidationFeedback
            isValidating={isValidating}
            isValid={isValid}
            validationError={validationError}
            apiUnavailable={apiUnavailable}
          />
        </FormControl>
      </Box>
    </Box>
  );
};

export default ConfigScreen;
