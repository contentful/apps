import React, { useEffect, useState } from 'react';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { Button } from '@contentful/forma-36-react-components';
import { BASE_URL, CLIENT_ID } from '../constants';

interface Props {
  sdk?: AppExtensionSDK;
  expireSoon?: boolean;
  isFullWidth: boolean;
  buttonType?: 'primary' | 'positive' | 'negative' | 'muted' | 'naked' | undefined;
  setToken: (token: string) => void;
}

export function TypeformOAuth({
  sdk,
  expireSoon,
  setToken,
  buttonType,
  isFullWidth,
  ...rest
}: Props) {
  const [oauthWindow, setOAuthWindow] = useState<Window | null>(null);

  useEffect(() => {
    if (sdk) {
      // we are on the config screen
      sdk.app.setReady();
    }
  }, [sdk]);

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
        window.localStorage.setItem('token', token);
        window.localStorage.setItem('expireTime', expireTime.toString());
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
    const url = `${BASE_URL}/oauth/authorize?&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
      `${window.location.origin}/callback`
    )}&scope=forms:read+workspaces:read`;

    setOAuthWindow(window.open(url, 'Typeform Contentful', 'left=150,top=10,width=800,height=900'));
  };

  return (
    <Button onClick={executeOauth} isFullWidth={isFullWidth} buttonType={buttonType} {...rest}>
      {expireSoon ? 'Reauthenticate with Typeform' : 'Sign in to Typeform'}
    </Button>
  );
}
