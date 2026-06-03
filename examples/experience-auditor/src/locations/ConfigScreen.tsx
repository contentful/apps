import React, { useCallback, useEffect, useState } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { Flex, Form, Heading, Note, Paragraph } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';

export interface AppInstallationParameters {}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const sdk = useSDK<ConfigAppSDK>();

  const onConfigure = useCallback(async () => {
    // The experience-toolbar location is not part of the EditorInterface, so
    // there is no `targetState` to assign — visibility is determined solely by
    // whether the location is registered on the app definition (see README).
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
    <Flex flexDirection="column" margin="spacingXl" gap="spacingM" style={{ maxWidth: '800px' }}>
      <Form>
        <Heading>Experience Auditor</Heading>
        <Paragraph>
          Experience Auditor runs inside the Experience Editor toolbar and continuously checks the
          experience you are editing for accessibility, SEO, and content-completeness issues.
        </Paragraph>
        <Note variant="primary">
          Nothing to configure here. Once installed, make sure the{' '}
          <code>experience-toolbar</code> location is registered on your app definition — the
          auditor appears automatically when editing an experience.
        </Note>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
