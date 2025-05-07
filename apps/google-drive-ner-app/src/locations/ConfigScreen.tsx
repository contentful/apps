import React, { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { Heading, Form, Flex, TextInput, FormControl } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';

interface AppInstallationParameters {
  token?: string;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const sdk = useSDK<ConfigAppSDK>();

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();
    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

  function updateToken(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setParameters({ token: value });
  }

  useEffect(() => {
    sdk.app.onConfigure(onConfigure);
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <Flex flexDirection="column" margin="spacingL">
      <Heading>App Config</Heading>
      <Form>
        <FormControl isRequired isInvalid={!parameters.token}>
          <FormControl.Label>API token</FormControl.Label>
          <TextInput value={parameters.token} type="text" name="token" onChange={updateToken} />
          <FormControl.HelpText>
            Provide an API token to access the Google Drive API.
          </FormControl.HelpText>
          {!parameters.token && (
            <FormControl.ValidationMessage>
              Please enter a valid API token
            </FormControl.ValidationMessage>
          )}
        </FormControl>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
