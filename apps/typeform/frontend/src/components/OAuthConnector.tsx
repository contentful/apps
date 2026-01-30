import React, { useState, useEffect } from 'react';
import { Flex, Button, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { CheckCircleIcon } from '@contentful/f36-icons';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { BASE_URL, getClientId } from '../constants';
import { setToken as setTokenWithBaseUrl, getToken, resetLocalStorage } from '../utils';
// @ts-ignore 2307
import logo from '../AppConfig/config-screen-logo.svg';

interface Props {
  sdk: AppExtensionSDK;
  baseUrl: string;
  onBaseUrlChange: (baseUrl: string) => void;
  onTokenChange: (token: string) => void;
  expireSoon?: boolean;
}

enum OAuthLoadingState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
}

export const OAuthConnector: React.FC<Props> = ({
  sdk,
  baseUrl,
  onBaseUrlChange,
  onTokenChange,
  expireSoon,
}) => {
  const [isOAuthConnected, setIsOAuthConnected] = useState(false);
  const [isHoveringConnected, setIsHoveringConnected] = useState(false);
  const [loadingState, setLoadingState] = useState<OAuthLoadingState>(OAuthLoadingState.IDLE);

  useEffect(() => {
    const token = getToken(baseUrl);
    setIsOAuthConnected(!!token);
  }, [baseUrl]);

  const handleOAuth = () => {
    setLoadingState(OAuthLoadingState.CONNECTING);
    const client_id = getClientId();
    const state = encodeURIComponent(JSON.stringify({ baseUrl }));
    const origin =
      process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : window.location.origin;
    const url = `${baseUrl}/oauth/authorize?&client_id=${client_id}&redirect_uri=${encodeURIComponent(
      `${origin}/callback`
    )}&scope=forms:read+workspaces:read&state=${state}`;

    const oauthWindow = window.open(
      url,
      'Typeform Contentful',
      'left=150,top=10,width=800,height=900'
    );

    const handleTokenEvent = ({ data, source }: any) => {
      if (source !== oauthWindow) {
        return;
      }

      const { token, expireTime, error } = data;

      if (error) {
        setLoadingState(OAuthLoadingState.IDLE);
      } else if (token) {
        setTokenWithBaseUrl(token, expireTime, baseUrl);
        handleTokenReceived(token);
        if (oauthWindow) {
          oauthWindow.close();
        }
      }

      window.removeEventListener('message', handleTokenEvent);
    };

    window.addEventListener('message', handleTokenEvent);
  };

  const handleDisconnect = () => {
    resetLocalStorage(baseUrl);
    setIsOAuthConnected(false);
    setIsHoveringConnected(false);
    onTokenChange('');
    setLoadingState(OAuthLoadingState.IDLE);
  };

  const handleTokenReceived = (token: string) => {
    setIsOAuthConnected(true);
    setIsHoveringConnected(false);
    setLoadingState(OAuthLoadingState.IDLE);
    onTokenChange(token);
  };

  const getButtonText = () => {
    switch (loadingState) {
      case OAuthLoadingState.CONNECTING:
        return 'Connecting...';
      case OAuthLoadingState.IDLE:
        if (isOAuthConnected && isHoveringConnected) return 'Disconnect';
        if (isOAuthConnected) return 'Connected';
        return 'Connect';
    }
  };

  const handleButtonClick = () => {
    if (loadingState !== OAuthLoadingState.IDLE) return;

    if (isOAuthConnected && isHoveringConnected) {
      handleDisconnect();
    } else if (!isOAuthConnected) {
      handleOAuth();
    }
  };

  const regionName =
    baseUrl === 'https://api.typeform.eu' ? 'EU (typeform.eu)' : 'US (typeform.com)';

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
          <img src={logo} alt="Typeform" height="28px" width="32px" />
        </Flex>
        <Text fontSize="fontSizeL" fontWeight="fontWeightMedium" lineHeight="lineHeightL">
          Typeform ({regionName})
        </Text>
      </Flex>
      <Flex
        gap="spacingXs"
        alignItems="center"
        onMouseEnter={() => {
          if (isOAuthConnected) {
            setIsHoveringConnected(true);
          }
        }}
        onMouseLeave={() => {
          setIsHoveringConnected(false);
        }}>
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
          isLoading={loadingState === OAuthLoadingState.CONNECTING}
          isDisabled={loadingState !== OAuthLoadingState.IDLE}>
          {getButtonText()}
        </Button>
      </Flex>
    </Flex>
  );
};
