import React, { useEffect } from 'react';
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
  let oauthWindow: Window | null;

  useEffect(() => {
    if (sdk) {
      // we are on the config screen
      sdk.app.setReady();
    }

    return () => window.removeEventListener('message', handleTokenEvent);
  }, []);

  const executeOauth = () => {
    const url = `${BASE_URL}/oauth/authorize?&client_id=${
      CLIENT_ID
    }&redirect_uri=${encodeURIComponent(
      `${window.location.origin}/callback`
    )}&scope=forms:read+workspaces:read`;

    oauthWindow = window.open(url, 'Typeform Contentful', 'left=150,top=10,width=800,height=900');

    window.addEventListener('message', handleTokenEvent);
  };

  const handleTokenEvent = ({ data }: any) => {
    const { token, error } = data;

    if (error) {
      console.error('There was an error authenticating. Please try again.');
    } else if (token) {
      setToken(token);
      if (oauthWindow) {
        oauthWindow.close();
      }
    }
  };

  return (
    <Button onClick={executeOauth} isFullWidth={isFullWidth} buttonType={buttonType} {...rest}>
      {expireSoon ? 'Reauthenticate with Typeform' : 'Sign in to Typeform'}
    </Button>
  );
}
