import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Form,
  Stack,
  Text,
  FormControl,
  TextInput,
  Note,
  Button,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { css } from '@emotion/css';

export interface AppInstallationParameters {
  // Non-secret parameters can be added here in the future
  apiKeyLength?: number;
  apiKeySuffix?: string;
}

/*
 * INTEG-3257: Config Screen
 */
const ConfigScreen = () => {
  const VISIBLE_SUFFIX_LENGTH = 4;
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [apiKeyIsValid, setApiKeyIsValid] = useState<boolean>(true);
  const [hasExistingApiKey, setHasExistingApiKey] = useState<boolean>(false);
  const [removeApiKey, setRemoveApiKey] = useState<boolean>(false);
  const [apiKeyObfuscatedDisplay, setApiKeyObfuscatedDisplay] = useState<string>('');
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isValidatingApiKey, setIsValidatingApiKey] = useState<boolean>(false);
  const sdk = useSDK<ConfigAppSDK>();
  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    // Only include the apiKey if user entered a new value.
    // This preserves an existing secret on save when input is left blank.
    const parametersToSave: Record<string, unknown> = {
      ...parameters,
      ...(apiKeyInput.trim() && apiKeyInput !== apiKeyObfuscatedDisplay
        ? { apiKey: apiKeyInput.trim() }
        : {}),
      // Save metadata to support obfuscated display in the future
      ...(apiKeyInput.trim() && apiKeyInput !== apiKeyObfuscatedDisplay
        ? {
            apiKeyLength: apiKeyInput.trim().length,
            apiKeySuffix: apiKeyInput.trim().slice(-VISIBLE_SUFFIX_LENGTH),
          }
        : {}),
      // If user requested removal and did not provide a new value, explicitly clear the secret
      ...((apiKeyInput === '' || apiKeyInput === apiKeyObfuscatedDisplay) &&
      removeApiKey &&
      hasExistingApiKey
        ? { apiKey: null }
        : {}),
      ...((apiKeyInput === '' || apiKeyInput === apiKeyObfuscatedDisplay) &&
      removeApiKey &&
      hasExistingApiKey
        ? { apiKeyLength: null, apiKeySuffix: null }
        : {}),
    };

    return {
      parameters: parametersToSave,
      targetState: currentState,
    };
  }, [parameters, apiKeyInput, apiKeyObfuscatedDisplay, removeApiKey, hasExistingApiKey, sdk]);

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
      const installed = await sdk.app.isInstalled();
      setIsInstalled(installed);

      if (currentParameters) {
        // Remove any secret-like value from local state so we don't accidentally
        // send back a redacted placeholder on save.
        const { apiKey, ...nonSecret } = currentParameters;
        setParameters(nonSecret);

        const hasMeta =
          typeof nonSecret.apiKeyLength === 'number' &&
          typeof nonSecret.apiKeySuffix === 'string' &&
          (nonSecret.apiKeyLength || 0) > 0;
        if (typeof apiKey === 'string' || hasMeta) {
          setHasExistingApiKey(true);
          setRemoveApiKey(false);
          setIsEditing(false);
          // Build obfuscated display using stored metadata if available
          const totalLength =
            (hasMeta ? (nonSecret.apiKeyLength as number) : (apiKey as string)?.length) || 8;
          const suffix =
            (hasMeta
              ? (nonSecret.apiKeySuffix as string)
              : (apiKey as string)?.slice(-VISIBLE_SUFFIX_LENGTH)) || '';
          const visibleSuffix = suffix.slice(-VISIBLE_SUFFIX_LENGTH);
          const maskedLength = Math.max(0, totalLength - visibleSuffix.length);
          const masked = '•'.repeat(maskedLength) + visibleSuffix;
          setApiKeyObfuscatedDisplay(masked);
          setApiKeyInput(masked);
        } else {
          setIsEditing(true);
        }
      }
      sdk.app.setReady();
    })();
  }, [sdk]);

  const validateApiKey = async (value: string) => {
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
      const response = await fetch(
        `https://www.googleapis.com/discovery/v1/apis/drive/v3/rest?key=${encodeURIComponent(
          trimmed
        )}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to validate API key');
      }
      setApiKeyIsValid(true);
      return true;
    } catch (e) {
      setApiKeyIsValid(false);
      return false;
    } finally {
      setIsValidatingApiKey(false);
    }
  };

  return (
    <Box style={{ maxWidth: '800px', margin: '64px auto' }}>
      <Box padding="spacingXl">
        <Stack
          spacing="spacingS"
          flexDirection="column"
          alignItems="flex-start"
          style={{ marginBottom: '32px' }}>
          <Text fontSize="fontSizeXl" fontWeight="fontWeightMedium">
            Set up Google Docs
          </Text>
          <Text fontColor="gray500">Configure access for the Google Docs app</Text>
        </Stack>
        <Form style={{ width: '100%' }}>
          <Stack spacing="spacingXl" flexDirection="column" alignItems="flex-start">
            <FormControl style={{ width: '100%' }}>
              <FormControl.Label>API Key</FormControl.Label>
              <Stack
                spacing="spacingS"
                flexDirection="row"
                alignItems="flex-end"
                style={{ width: '100%' }}>
                <TextInput
                  id="apiKey"
                  name="apiKey"
                  type={
                    apiKeyInput === apiKeyObfuscatedDisplay && hasExistingApiKey
                      ? 'text'
                      : 'password'
                  }
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value);
                    // If typing a new value after scheduling deletion, cancel deletion
                    if (removeApiKey) setRemoveApiKey(false);
                  }}
                  onFocus={() => {
                    if (apiKeyInput === apiKeyObfuscatedDisplay && hasExistingApiKey) {
                      setApiKeyInput('');
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    // If user didn't enter a new value, restore obfuscated display
                    if (!removeApiKey && hasExistingApiKey && val.length === 0) {
                      setApiKeyInput(apiKeyObfuscatedDisplay);
                      setApiKeyIsValid(true);
                      return;
                    }
                    void validateApiKey(e.target.value);
                  }}
                  isInvalid={!apiKeyIsValid}
                  placeholder={
                    hasExistingApiKey ? 'Leave blank to keep existing secret' : 'Enter API key'
                  }
                  isDisabled={hasExistingApiKey && !isEditing}
                  style={{ flex: 1 }}
                />
                {hasExistingApiKey &&
                  (!isEditing ? (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        if (apiKeyInput === apiKeyObfuscatedDisplay && hasExistingApiKey) {
                          setApiKeyInput('');
                        }
                        setIsEditing(true);
                      }}>
                      Edit
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setIsEditing(false);
                        setApiKeyInput(apiKeyObfuscatedDisplay);
                        setApiKeyIsValid(true);
                        setRemoveApiKey(false);
                      }}>
                      Cancel
                    </Button>
                  ))}
              </Stack>
              <FormControl.HelpText>
                Stored securely as a secret installation parameter. It won’t be readable later.
              </FormControl.HelpText>
              {!apiKeyIsValid && (
                <FormControl.ValidationMessage>
                  Invalid API key format
                </FormControl.ValidationMessage>
              )}
              {apiKeyInput.trim() &&
                apiKeyInput !== apiKeyObfuscatedDisplay &&
                apiKeyIsValid &&
                !removeApiKey && (
                  <Note variant="primary">
                    {isInstalled
                      ? 'Click Save in the top right to apply this API key.'
                      : 'Click Install to selected environments to apply this API key.'}
                  </Note>
                )}
            </FormControl>

            {hasExistingApiKey && !apiKeyInput && !removeApiKey && (
              <>
                <Note>
                  A secret API key is already saved. Enter a new value to replace it, leave blank to
                  keep it, or remove it.
                </Note>
                <Button variant="negative" size="small" onClick={() => setRemoveApiKey(true)}>
                  Remove API key
                </Button>
              </>
            )}
            {removeApiKey && !apiKeyInput && (
              <>
                <Note variant="warning">
                  The saved API key will be deleted when you click Save. This cannot be undone.
                </Note>
                <Button variant="secondary" size="small" onClick={() => setRemoveApiKey(false)}>
                  Undo
                </Button>
              </>
            )}
          </Stack>
        </Form>
      </Box>
    </Box>
  );
};

export default ConfigScreen;
