import { useCallback, useEffect, useState, useRef } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Form,
  FormControl,
  Heading,
  Paragraph,
  TextInput,
  Button,
  Tooltip,
} from '@contentful/f36-components';
import { ArrowSquareOutIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { getAppActionId } from '../utils/appFunctionUtils';

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
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [isOAuthConnected, setIsOAuthConnected] = useState(false);
  const [isHoveringConnected, setIsHoveringConnected] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const popupWindowRef = useRef<Window | null>(null);
  const checkWindowIntervalRef = useRef<number | null>(null);

  // Check Klaviyo connection status with polling to handle race conditions
  const checkGoogleStatus = async (
    expectedStatus?: boolean,
    maxRetries: number = 10
  ): Promise<void> => {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Checking Google Docs connection status (attempt ${attempt}/${maxRetries})...`);

        const checkStatusAppActionId = await getAppActionId(sdk, 'checkGdocOauthTokenStatus');
        if (!checkStatusAppActionId) {
          console.warn('Check Status app action not found');
          setIsCheckingStatus(false);
          return;
        }

        const response = await sdk.cma.appActionCall.createWithResponse(
          {
            appActionId: checkStatusAppActionId,
            appDefinitionId: sdk.ids.app,
          },
          {
            parameters: {},
          }
        );

        const statusData = JSON.parse(response.response.body);
        console.log(`Google Docs status response (attempt ${attempt}):`, statusData);

        // Assuming the response contains a connected field
        const isConnected = statusData.connected === true;
        console.log(`Google Docs connection status (attempt ${attempt}):`, isConnected);

        // If we have an expected status and it matches, or if we don't have an expected status, accept the result
        if (expectedStatus === undefined || isConnected === expectedStatus) {
          setIsOAuthConnected(isConnected);
          console.log(`Status check resolved to expected value: ${isConnected}`);
          break;
        } else {
          console.log(
            `Status mismatch. Expected: ${expectedStatus}, Got: ${isConnected}. Retrying...`
          );

          // If this is the last attempt, accept the current result anyway
          if (attempt === maxRetries) {
            console.log(`Max retries reached. Accepting current status: ${isConnected}`);
            setIsOAuthConnected(isConnected);
            break;
          }

          // Wait before retrying (exponential backoff: 500ms, 1000ms, 1500ms, etc.)
          const waitTime = 500 * attempt;
          console.log(`Waiting ${waitTime}ms before retry...`);
          await delay(waitTime);
        }
      } catch (error) {
        console.error(`Failed to check Google Docs status (attempt ${attempt}):`, error);

        // If this is the last attempt, set status to false and give up
        if (attempt === maxRetries) {
          console.log('Max retries reached. Setting status to false due to errors.');
          setIsOAuthConnected(false);
          break;
        }

        // Wait before retrying on error
        const waitTime = 500 * attempt;
        console.log(`Waiting ${waitTime}ms before retry after error...`);
        await delay(waitTime);
      }
    }

    setIsCheckingStatus(false);
    console.log(`Status check polling completed. Final status: ${isOAuthConnected}`);
  };

  const messageHandler = async (event: MessageEvent) => {
    if (event.data.type === 'oauth:complete') {
      const appDefinitionId = sdk.ids.app;
      // call app action to complete oauth
      const completeOauthAppActionId = await getAppActionId(sdk, 'completeGdocOauth');

      await sdk.cma.appActionCall.create(
        { appDefinitionId, appActionId: completeOauthAppActionId },
        {
          parameters: {
            code: event.data.code,
            state: event.data.state,
          },
        }
      );
      // Check the updated status after OAuth completion - expect it to be connected
      await checkGoogleStatus(true);

      sdk.notifier.success('OAuth complete');
      cleanup();
      setIsOAuthLoading(false);
    }
  };

  const cleanup = () => {
    if (checkWindowIntervalRef.current) {
      window.clearInterval(checkWindowIntervalRef.current);
      checkWindowIntervalRef.current = null;
    }
    // Remove the message event listener
    console.log('Removing message event listener');
    window.removeEventListener('message', messageHandler);
    console.log('Message event listener removed');
    // Close the popup if it's still open
    if (popupWindowRef.current && !popupWindowRef.current.closed) {
      popupWindowRef.current.close();
    }
    popupWindowRef.current = null;
  };

  const handleOAuth = async () => {
    console.log('handleOAuth started');
    setIsOAuthLoading(true);

    window.removeEventListener('message', messageHandler);
    window.addEventListener('message', messageHandler);

    try {
      const initiateOauthAppActionId = await getAppActionId(sdk, 'initiateGdocOauth');

      const response = await sdk.cma.appActionCall.createWithResponse(
        {
          appActionId: initiateOauthAppActionId,
          appDefinitionId: sdk.ids.app,
        },
        {
          parameters: {},
        }
      );

      const authorizationUrl = JSON.parse(response.response.body).authorizationUrl;

      popupWindowRef.current = window.open(authorizationUrl, '_blank', 'height=700,width=450');

      // Check if the window was closed
      // checkWindowIntervalRef.current = window.setInterval(() => {
      //   if (popupWindowRef.current?.closed) {
      //     cleanup();
      //     setIsOAuthLoading(false);
      //   }
      // }, 1000);
    } catch (error) {
      console.error('Failed to initiate OAuth:', error);
      cleanup();
      setIsOAuthLoading(false);
      sdk.notifier.error('Failed to initiate OAuth flow');
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const disconnectAppActionId = await getAppActionId(sdk, 'revokeGdocOauthToken');

      await sdk.cma.appActionCall.create(
        {
          appActionId: disconnectAppActionId,
          appDefinitionId: sdk.ids.app,
        },
        { parameters: {} }
      );

      // Check the updated status after disconnection - expect it to be disconnected
      await checkGoogleStatus(false);

      setIsHoveringConnected(false);
      sdk.notifier.success('Disconnected from Google Docs');
    } catch (error) {
      console.error('Failed to disconnect:', error);
      sdk.notifier.error('Failed to disconnect from Google Docs');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getButtonText = () => {
    if (isDisconnecting) return 'Disconnecting...';
    if (isCheckingStatus) return 'Checking...';
    if (isOAuthLoading) return 'Connecting...';
    if (isOAuthConnected && isHoveringConnected) return 'Disconnect';
    if (isOAuthConnected) return 'Connected';
    return 'Connect';
  };

  const getButtonVariant = () => {
    if (isCheckingStatus) return 'secondary';
    if (isOAuthConnected && !isHoveringConnected) return 'positive';
    if (isOAuthConnected && isHoveringConnected) return 'negative';
    return 'primary';
  };

  const handleButtonClick = () => {
    if (isCheckingStatus) return; // Don't allow clicks while checking status
    if (isOAuthConnected && isHoveringConnected) {
      handleDisconnect();
    } else if (!isOAuthConnected && !isOAuthLoading) {
      handleOAuth();
    }
  };

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
      const isInstalled = await sdk.app.isInstalled();
      setIsReadOnly(isInstalled);

      // Check Google Docs connection status
      if (isInstalled) {
        await checkGoogleStatus();
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
          <Box style={{ marginBottom: '32px', width: '100%' }}>
            <Tooltip
              content="App must be installed to connect"
              isDisabled={isReadOnly}
              placement="top">
              <Button
                variant={getButtonVariant()}
                onClick={handleButtonClick}
                onMouseEnter={() => {
                  if (isOAuthConnected) {
                    setIsHoveringConnected(true);
                  }
                }}
                onMouseLeave={() => {
                  setIsHoveringConnected(false);
                }}
                isLoading={isOAuthLoading}
                isDisabled={isOAuthLoading || isDisconnecting || isCheckingStatus || !isReadOnly}>
                {getButtonText()}
              </Button>
            </Tooltip>
          </Box>
          <FormControl style={{ width: '100%' }}>
            <FormControl.Label isRequired>OpenAPI key</FormControl.Label>
            <Box style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <TextInput
                id="apiKey"
                name="apiKey"
                value={openAiApiKeyInput}
                placeholder="sk-xxxx"
                onChange={(e) => setOpenAiApiKeyInput(e.target.value)}
                onBlur={() => void validateApiKey(openAiApiKeyInput)}
                isInvalid={!openAiApiKeyIsValid}
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
            {!openAiApiKeyIsValid && (
              <Paragraph marginTop="spacingS" style={{ color: '#cc2e2e' }}>
                Unable to validate the API key. Please check and try again.
              </Paragraph>
            )}
            {isValidatingOpenAiApiKey && (
              <Paragraph marginTop="spacingS">Validating key…</Paragraph>
            )}
          </FormControl>
        </Form>
      </Box>
    </Box>
  );
};

export default ConfigScreen;
