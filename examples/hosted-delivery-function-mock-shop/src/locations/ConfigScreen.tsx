import React, { useCallback, useState, useEffect, } from "react";
import { ConfigAppSDK } from "@contentful/app-sdk";
import {
  Heading,
  Form,
  Flex,
  TextInput,
  FormControl,
} from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";

export interface AppInstallationParameters {
  apiEndpoint?: string;
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

  function updateApiEndpoint(e: React.ChangeEvent) {
    const value = (e.target as HTMLInputElement).value;
    setParameters({ apiEndpoint: value });
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
        <FormControl isRequired isInvalid={!parameters.apiEndpoint}>
          <FormControl.Label>API endpoint</FormControl.Label>
          <TextInput
            value={parameters.apiEndpoint}
            type="url"
            name="apiEndpoint"
            onChange={updateApiEndpoint}
          />
          <FormControl.HelpText>
            Provide the url to the API endpoint of the shop
          </FormControl.HelpText>
          {!parameters.apiEndpoint && (
            <FormControl.ValidationMessage>
              Please, provide API endpoint
            </FormControl.ValidationMessage>
          )}
        </FormControl>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
