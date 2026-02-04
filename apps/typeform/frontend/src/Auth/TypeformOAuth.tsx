import React, { useEffect, useState } from 'react';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { Button } from '@contentful/f36-components';
import { BASE_URL, getClientId } from '../constants';
import { InstallationParameters } from '../typings';
import { setToken as setTokenWithBaseUrl } from '../utils';

interface Props {
  sdk?: AppExtensionSDK;
  expireSoon?: boolean;
  isFullWidth: boolean;
  buttonType?: 'primary' | 'positive' | 'negative' | 'secondary' | 'transparent' | undefined;
  setToken: (token: string) => void;
  baseUrl?: string;
}

export function TypeformOAuth({
  sdk,
  expireSoon,
  setToken,
  buttonType,
  isFullWidth,
  baseUrl,
  ...rest
}: Props) {
  const [oauthWindow, setOAuthWindow] = useState<Window | null>(null);
  const [effectiveBaseUrl, setEffectiveBaseUrl] = useState<string>(baseUrl || BASE_URL);

  useEffect(() => {
    if (sdk) {
      // we are on the config screen
      sdk.app.setReady();
      // Get baseUrl from installation parameters if not provided as prop
      if (!baseUrl) {
        sdk.app.getParameters().then((params) => {
          const installationParams = params as InstallationParameters | null;
          if (installationParams?.baseUrl) {
            setEffectiveBaseUrl(installationParams.baseUrl);
          }
        });
      } else {
        // Update effectiveBaseUrl when baseUrl prop changes
        setEffectiveBaseUrl(baseUrl);
      }
    } else if (baseUrl) {
      // Update effectiveBaseUrl when baseUrl prop changes (even without sdk)
      setEffectiveBaseUrl(baseUrl);
    }
  }, [sdk, baseUrl]);

  useEffect(() => {
    if (oauthWindow === null) {
      return;
    }

    const handleTokenEvent = ({ data, source }: any) => {
      if (source !== oauthWindow) {
        return;
      }

      const { token, expireTime, error } = data;

      if (error) {
        console.error('There was an error authenticating. Please try again.');
      } else if (token) {
        // Store token with baseUrl so it's region-specific
        setTokenWithBaseUrl(token, expireTime, effectiveBaseUrl);
        setToken(token);
        if (oauthWindow) {
          oauthWindow.close();
        }
      }
    };

    window.addEventListener('message', handleTokenEvent);
    return () => window.removeEventListener('message', handleTokenEvent);
  }, [oauthWindow, setToken]);

  const executeOauth = () => {
    console.log('executeOauth', effectiveBaseUrl);
    const client_id = getClientId();
    // Encode baseUrl in the state parameter so callback can retrieve it
    const state = encodeURIComponent(JSON.stringify({ baseUrl: effectiveBaseUrl }));
    const url = `${effectiveBaseUrl}/oauth/authorize?&client_id=${client_id}&redirect_uri=${encodeURIComponent(
      `http://localhost:3001/callback`
    )}&scope=forms:read+workspaces:read&state=${state}`;

    setOAuthWindow(window.open(url, 'Typeform Contentful', 'left=150,top=10,width=800,height=900'));
  };

  return (
    <Button onClick={executeOauth} isFullWidth={isFullWidth} variant={buttonType} {...rest}>
      {expireSoon ? 'Reauthenticate with Typeform' : 'Sign in to Typeform'}
    </Button>
  );
}
