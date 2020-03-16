import React, { useEffect } from 'react';
import { AppExtensionSDK } from 'contentful-ui-extensions-sdk';
import { Button } from '@contentful/forma-36-react-components';

interface Props {
  sdk: AppExtensionSDK;
}

const CLIENT_ID = '8DAtABe5rFEnpJJw8Uco2e65ewrZq6kALSfCBe4N11LW';
const OAUTH_REDIRECT_URI = 'http://www.localhost:1234/callback';
const CLIENT_SECRET = 'ByNjuGDXBrjLf38sJQ8B8cDrRMW4jGVYk15PfyemHt7H';

export function AppAuthConfig({ sdk }: Props) {
  useEffect(() => {
    sdk.app.setReady();
  }, []);

  const executeOauth = () => {
    const url = `https://api.typeform.com/oauth/authorize?state=1234&client_id=${CLIENT_ID}&redirect_uri=${OAUTH_REDIRECT_URI}&scope=forms:read`;

    console.log(url);

    const oauthWindow = window.open(
      url,
      'Typeform Contentful',
      'left=150,top=10,width=800,height=900'
    );
    window.addEventListener('message', ({ data }) => {
      const { token, error } = data;

      if (error) {
        console.error('There was an error authenticating. Please refresh and try again.');
      } else if (token) {
        console.log(token);
      }

      if (oauthWindow) {
        oauthWindow.close();
      }
    });
  };

  return (
    <div>
      <Button onClick={executeOauth} buttonType="primary">
        Connect to Typeform
      </Button>
    </div>
  );
}
