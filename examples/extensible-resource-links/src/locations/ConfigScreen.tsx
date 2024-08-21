import React, { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Heading,
  Form,
  Flex,
  TextInput,
  FormControl,
  TextLink
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';

interface AppInstallationParameters {
  tmdbAccessToken?: string;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const sdk = useSDK<ConfigAppSDK>();

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();
    return {
      parameters,
      targetState: currentState
    };
  }, [parameters, sdk]);

  function updateParameters<T extends keyof AppInstallationParameters>(
    parameterName: T
  ) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setParameters({ ...parameters, [parameterName]: value });
    };
  }

  useEffect(() => {
    sdk.app.onConfigure(onConfigure);
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null =
        await sdk.app.getParameters();

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
        <FormControl isRequired isInvalid={!parameters.tmdbAccessToken}>
          <FormControl.Label>API token</FormControl.Label>
          <TextInput
            value={parameters.tmdbAccessToken}
            name="tmdbAccessToken"
            onChange={updateParameters('tmdbAccessToken')}
          />
          <FormControl.HelpText>
            Provide the access token for TMDB
          </FormControl.HelpText>
          {!parameters.tmdbAccessToken && (
            <FormControl.ValidationMessage>
              Please, provide a valid API token. You can get one by signing up
              at <TextLink href="https://www.themoviedb.org/">TMDB</TextLink>.
            </FormControl.ValidationMessage>
          )}
        </FormControl>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
