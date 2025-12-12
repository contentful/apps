import { useEffect, useState, useRef } from 'react';
import { Box, Button, Stack, Text } from '@contentful/f36-components';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

export const OAuthConnector = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [isOAuthConnected, setIsOAuthConnected] = useState(false);
  const [isHoveringConnected, setIsHoveringConnected] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const popupWindowRef = useRef<Window | null>(null);
  const checkWindowIntervalRef = useRef<number | null>(null);

  // Check Google OAuth connection status with polling to handle race conditions
  const checkGoogleOAuthStatus = async (
    expectedStatus?: boolean,
    maxRetries: number = 10
  ): Promise<void> => {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `Checking Google OAuth connection status (attempt ${attempt}/${maxRetries})...`
        );
        const appActions = await sdk.cma.appAction.getManyForEnvironment({
          environmentId: sdk.ids.environment,
          spaceId: sdk.ids.space,
        });

        const checkStatusAppAction = appActions.items.find(
          (action) => action.name === 'checkGdocOauthTokenStatus'
        );
        if (!checkStatusAppAction) {
          console.warn('checkGdocOauthTokenStatus app action not found');
          setIsCheckingStatus(false);
          return;
        }

        const response = await sdk.cma.appActionCall.createWithResponse(
          {
            appActionId: checkStatusAppAction.sys.id,
            appDefinitionId: sdk.ids.app,
          },
          {
            parameters: {},
          }
        );

        const statusData = JSON.parse(response.response.body);
        console.log(`Google OAuth status response (attempt ${attempt}):`, statusData);

        // Assuming the response contains a connected field
        const isConnected = statusData.connected === true;
        console.log(`Google OAuth connection status (attempt ${attempt}):`, isConnected);

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
        console.error(`Failed to check Google OAuth status (attempt ${attempt}):`, error);

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
      const appActions = await sdk.cma.appAction.getManyForEnvironment({
        environmentId: sdk.ids.environment,
        spaceId: sdk.ids.space,
      });
      const completeOauthAppAction = appActions.items.find(
        (action) => action.name === 'completeGdocOauth'
      );
      await sdk.cma.appActionCall.create(
        { appDefinitionId, appActionId: completeOauthAppAction?.sys.id || '' },
        {
          parameters: {
            code: event.data.code,
            state: event.data.state,
          },
        }
      );
      // Check the updated status after OAuth completion - expect it to be connected
      await checkGoogleOAuthStatus(true);

      sdk.notifier.success('OAuth complete');
      cleanup();
      setIsOAuthLoading(false);
    }
  };

  const cleanup = () => {
    // Clear the interval
    if (checkWindowIntervalRef.current) {
      window.clearInterval(checkWindowIntervalRef.current);
      checkWindowIntervalRef.current = null;
    }
    // Remove the message event listener
    window.removeEventListener('message', messageHandler);
    // Close the popup if it's still open
    if (popupWindowRef.current && !popupWindowRef.current.closed) {
      popupWindowRef.current.close();
    }
    popupWindowRef.current = null;
  };

  const handleOAuth = async () => {
    setIsOAuthLoading(true);

    window.removeEventListener('message', messageHandler);
    window.addEventListener('message', messageHandler);

    try {
      const appActions = await sdk.cma.appAction.getManyForEnvironment({
        environmentId: sdk.ids.environment,
        spaceId: sdk.ids.space,
      });

      const initiateOauthAppAction = appActions.items.find(
        (action) => action.name === 'initiateGdocOauth'
      );

      const response = await sdk.cma.appActionCall.createWithResponse(
        {
          appActionId: initiateOauthAppAction?.sys.id || '',
          appDefinitionId: sdk.ids.app,
        },
        {
          parameters: {},
        }
      );
      const { authorizeUrl } = JSON.parse(response.response.body);

      popupWindowRef.current = window.open(
        `${authorizeUrl}&access_type=offline&prompt=consent`,
        '_blank',
        'height=700,width=450'
      );
    } catch (error) {
      cleanup();
      setIsOAuthLoading(false);
      sdk.notifier.error('Failed to initiate OAuth flow');
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const appActions = await sdk.cma.appAction.getManyForEnvironment({
        environmentId: sdk.ids.environment,
        spaceId: sdk.ids.space,
      });
      const disconnectAppAction = appActions.items.find(
        (action) => action.name === 'revokeGdocOauthToken'
      );
      await sdk.cma.appActionCall.create(
        {
          appActionId: disconnectAppAction?.sys.id || '',
          appDefinitionId: sdk.ids.app,
        },
        { parameters: {} }
      );

      // Check the updated status after disconnection - expect it to be disconnected
      await checkGoogleOAuthStatus(false);

      setIsHoveringConnected(false);
      sdk.notifier.success('Disconnected from Google OAuth');
    } catch (error) {
      sdk.notifier.error('Failed to disconnect from Google OAuth');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getButtonText = () => {
    if (isDisconnecting) return 'Disconnecting';
    if (isCheckingStatus) return 'Checking';
    if (isOAuthLoading) return 'Connecting';
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

  useEffect(() => {
    const initializeApp = async () => {
      await checkGoogleOAuthStatus();
    };
    initializeApp();
  }, []);

  return (
    <Box style={{ maxWidth: '800px', margin: '64px auto' }}>
      <Box padding="spacingXl" style={{ border: '1px solid #E5EBED', borderRadius: '4px' }}>
        <Stack
          spacing="spacingS"
          flexDirection="column"
          alignItems="flex-start"
          style={{ marginBottom: '32px' }}>
          <Text fontSize="fontSizeXl" fontWeight="fontWeightMedium">
            Set up Google OAuth
          </Text>
          <Text fontColor="gray500">Seamlessly sync content from Contentful to Google Docs</Text>
        </Stack>
        <Box style={{ marginBottom: '32px', width: '100%' }}>
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
            isDisabled={isOAuthLoading || isDisconnecting || isCheckingStatus}>
            {getButtonText()}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
