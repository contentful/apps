import React, { useEffect } from 'react';
import { AppExtensionSDK } from 'contentful-ui-extensions-sdk';
import { Button } from '@contentful/forma-36-react-components';
import { BASE_URL } from '../constants';

interface Props {
  sdk?: AppExtensionSDK;
  expireSoon?: boolean;
  setToken: (token: string) => void;
}

export function TypeformOAuth({ sdk, expireSoon, setToken, ...rest }: Props) {
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
      process.env.CLIENT_ID
    }&redirect_uri=${encodeURIComponent(
      process.env.OAUTH_REDIRECT_URI as string
    )}&scope=forms:read+workspaces:read&state=${encodeURIComponent(window.location.href)}`;

    oauthWindow = window.open(url, 'Typeform Contentful', 'left=150,top=10,width=800,height=900');

    window.addEventListener('message', handleTokenEvent);
  };

  const handleTokenEvent = ({ data }: any) => {
    const { token, error } = data;

    if (error) {
      console.error('There was an error authenticating. Please refresh and try again.');
    } else if (token) {
      setToken(token);
      if (oauthWindow) {
        oauthWindow.close();
      }
    }
  };

  return (
    <Button onClick={executeOauth} buttonType="primary" {...rest}>
      {expireSoon ? 'Reauthenticate with Typeform' : 'Sign in to Typeform'}
    </Button>
  );
}
