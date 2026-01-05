import { useEffect, useState, useRef } from 'react';
import { Button, Flex, Text, Image } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { CheckCircleIcon } from '@contentful/f36-icons';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import googleDriveLogo from '../../../../assets/google-drive.png';
import { callAppAction, callAppActionWithResponse } from '../../../../utils/appAction';

type OAuthConnectorProps = {
  onOAuthConnectedChange: (oauthConnectionStatus: boolean) => void;
  isOAuthConnected: boolean;
  onOauthTokenChange: (token: string) => void;
  oauthToken: string;
};

export const OAuthConnector = ({
  onOAuthConnectedChange,
  isOAuthConnected,
  oauthToken,
  onOauthTokenChange,
}: OAuthConnectorProps) => {
  const sdk = useSDK<ConfigAppSDK>();
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [isHoveringConnected, setIsHoveringConnected] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const popupWindowRef = useRef<Window | null>(null);
  const checkWindowIntervalRef = useRef<number | null>(null);

  // Check Google OAuth connection status with polling to handle race conditions
  const checkGoogleOAuthStatus = async (
    expectedStatus?: boolean,
    maxRetries: number = 5
  ): Promise<void> => {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `Checking Google OAuth connection status (attempt ${attempt}/${maxRetries})...`
        );

        const response = await callAppActionWithResponse(sdk, 'checkGdocOauthTokenStatus', {});
        const statusResponse = JSON.parse(response.response.body);
        console.log(`Google OAuth status response (attempt ${attempt}):`, statusResponse);

        // Assuming the response contains a connected field
        const isConnected = statusResponse.connected === true;
        console.log(`Google OAuth connection status (attempt ${attempt}):`, isConnected);
        onOauthTokenChange(statusResponse.token);

        // If we have an expected status and it matches, or if we don't have an expected status, accept the result
        if (expectedStatus === undefined || isConnected === expectedStatus) {
          onOAuthConnectedChange(isConnected);
          console.log(`Status check resolved to expected value: ${isConnected}`);
          break;
        } else {
          console.log(
            `Status mismatch. Expected: ${expectedStatus}, Got: ${isConnected}. Retrying...`
          );

          // If this is the last attempt, accept the current result anyway
          if (attempt === maxRetries) {
            console.log(`Max retries reached. Accepting current status: ${isConnected}`);
            onOAuthConnectedChange(isConnected);
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
          onOAuthConnectedChange(false);
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
      await callAppAction(sdk, 'completeGdocOauth', {
        code: event.data.code,
        state: event.data.state,
      });
      // Check the updated status after OAuth completion - expect it to be connected
      await checkGoogleOAuthStatus(true);
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
      const response = await callAppActionWithResponse(sdk, 'initiateGdocOauth', {});
      const { authorizeUrl } = JSON.parse(response.response.body);

      popupWindowRef.current = window.open(
        `${authorizeUrl}&access_type=offline&prompt=consent`,
        '_blank',
        'height=700,width=450'
      );
    } catch (error) {
      cleanup();
      setIsOAuthLoading(false);
      sdk.notifier.error('Unable to connect to Google Drive. Please try again.');
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await callAppAction(sdk, 'revokeGdocOauthToken', {});

      // Check the updated status after disconnection - expect it to be disconnected
      await checkGoogleOAuthStatus(false);

      setIsHoveringConnected(false);
    } catch (error) {
      sdk.notifier.error('Unable to disconnect from Google Drive. Please try again.');
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
    <Flex
      alignItems="center"
      justifyContent="space-between"
      style={{
        padding: `${tokens.spacingS} ${tokens.spacingL}`,
        border: `1px solid ${tokens.gray300}`,
        borderRadius: tokens.borderRadiusMedium,
      }}>
      <Flex gap="spacingS" alignItems="center" justifyContent="center">
        <Flex
          alignItems="center"
          justifyContent="center"
          style={{
            height: '40px',
            width: '40px',
            border: `1px solid ${tokens.gray300}`,
            borderRadius: tokens.borderRadiusMedium,
            backgroundColor: tokens.gray100,
          }}>
          <Image src={googleDriveLogo} alt="Google Drive" height="28px" width="32px" />
        </Flex>
        <Text fontSize="fontSizeL" fontWeight="fontWeightMedium" lineHeight="lineHeightL">
          Google Drive
        </Text>
      </Flex>
      <Flex gap="spacingXs" alignItems="center">
        {isOAuthConnected && isHoveringConnected && (
          <Text
            fontSize="fontSizeS"
            fontWeight="fontWeightMedium"
            lineHeight="lineHeightS"
            fontColor="gray500">
            Status: connected
          </Text>
        )}
        <Button
          variant={isOAuthConnected && isHoveringConnected ? 'negative' : 'secondary'}
          size="small"
          endIcon={isOAuthConnected && !isHoveringConnected ? <CheckCircleIcon /> : undefined}
          onClick={handleButtonClick}
          onMouseEnter={() => {
            if (isOAuthConnected) {
              setIsHoveringConnected(true);
            }
          }}
          onMouseLeave={() => {
            setIsHoveringConnected(false);
          }}
          isLoading={isOAuthLoading || isDisconnecting || isCheckingStatus}
          isDisabled={isOAuthLoading || isDisconnecting || isCheckingStatus}>
          {getButtonText()}
        </Button>
      </Flex>
    </Flex>
  );
};
