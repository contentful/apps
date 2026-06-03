import React, { useCallback, useEffect, useState } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { Flex, Form, Heading, Paragraph, Note } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';

export interface AppInstallationParameters {}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const sdk = useSDK<ConfigAppSDK>();

  const onConfigure = useCallback(async () => {
    // This method is called when a user clicks "Install" or "Save" on the
    // configuration screen. The experience-toolbar location is not part of the
    // EditorInterface, so there is no `targetState` to assign here — visibility
    // is determined solely by whether the location is registered on the app
    // definition (see README). We persist installation parameters and keep the
    // current state as-is.
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

      // Once preparation has finished, call `setReady` to hide the loading
      // screen and present the app to the user.
      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <Flex flexDirection="column" margin="spacingXl" gap="spacingM" style={{ maxWidth: '800px' }}>
      <Form>
        <Heading>Experience Toolbar example</Heading>
        <Paragraph>
          This app renders in the Experience Editor toolbar. There is nothing to configure here —
          once installed, make sure the <code>experience-toolbar</code> location is registered on
          your app definition and the toolbar app will appear when editing an experience.
        </Paragraph>
        <Note variant="primary">
          The toolbar location is not assigned per content type. Unlike sidebar or field apps, it
          has no <code>EditorInterface</code> target state — it is shown whenever the location is
          registered.
        </Note>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
