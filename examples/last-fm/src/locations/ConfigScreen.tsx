import React, { useCallback, useState, useEffect } from 'react';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { Form, FormControl, Flex, TextInput } from '@contentful/f36-components';
import { css } from 'emotion';
import { useSDK } from '@contentful/react-apps-toolkit';

export interface AppInstallationParameters {
  apiKey: string | undefined;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({ apiKey: '' });
  const sdk = useSDK<AppExtensionSDK>();

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
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
    <Flex flexDirection="column" className={css({ margin: '80px', maxWidth: '800px' })}>
      <Form>
        <FormControl>
          <FormControl.Label>API Key</FormControl.Label>
          <TextInput
            value={parameters.apiKey}
            type="text"
            onChange={(e) => setParameters({ ...parameters, apiKey: e.target.value })}
          />
        </FormControl>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
