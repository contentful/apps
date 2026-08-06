import { ConfigAppSDK } from '@contentful/app-sdk';
import { Flex, Form, Heading, Note, Paragraph, Subheading } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useEffect } from 'react';

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();

  useEffect(() => {
    sdk.app.onConfigure(async () => {
      const currentState = await sdk.app.getCurrentState();
      return { parameters: {}, targetState: currentState };
    });
  }, [sdk]);

  useEffect(() => {
    sdk.app.setReady();
  }, [sdk]);

  return (
    <Flex flexDirection="column" alignItems="center">
      <Form style={{ maxWidth: 600 }}>
        <Heading>Translation Companion</Heading>
        <Paragraph>
          This app has no configuration of its own. Its only job is to exist as an installed App
          Definition so it carries an App Identity -- credentials that let Translation product
          services authenticate to the Content Management API without a user in the loop, for
          scheduled jobs and webhook-driven syncs.
        </Paragraph>

        <Subheading marginTop="spacingXl">Uninstall warning</Subheading>
        <Note variant="warning">
          <Paragraph>
            Uninstalling this app revokes the App Access Tokens for the Contentful Translation
            system. Any Translation feature relying on unattended CMA access in this space and
            environment will stop working immediately.
          </Paragraph>
        </Note>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
