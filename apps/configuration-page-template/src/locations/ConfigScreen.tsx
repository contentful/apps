import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import {
  Card,
  Flex,
  Form,
  FormControl,
  Heading,
  Paragraph,
  Subheading,
  TextInput,
  TextLink,
} from '@contentful/f36-components';
import { LinkSimpleIcon } from '@contentful/f36-icons';

export interface AppInstallationParameters {}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const sdk = useSDK<ConfigAppSDK>();

  const [apiKey, setApiKey] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

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
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      fullWidth
      gap="spacingM"
      style={{ padding: '20px 80px' }}>
      <Card padding="large">
        <Flex flexDirection="column" gap="spacingS" fullWidth>
          <Heading as="h1" marginBottom="none">
            Set up my marketplace app
          </Heading>
          <Paragraph marginBottom="none">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </Paragraph>
        </Flex>
      </Card>

      <Card padding="large">
        <Flex flexDirection="column" gap="spacingL">
          <Flex flexDirection="column" gap="spacingXs">
            <Subheading marginBottom="none">Disclaimer</Subheading>
            <Paragraph marginBottom="none">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </Paragraph>
          </Flex>
        </Flex>
      </Card>

      <Card padding="large">
        <Flex flexDirection="column" gap="spacing3Xl" fullWidth>
          <Flex flexDirection="column" gap="spacingL">
            <Flex flexDirection="column" gap="spacingS">
              <Subheading marginBottom="none">Configure access</Subheading>
              <Paragraph marginBottom="none">Section subtitle with basic instructions</Paragraph>
            </Flex>

            <Form>
              <FormControl isRequired marginBottom="spacingL">
                <FormControl.Label>Your key</FormControl.Label>
                <TextInput
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-...dsvb"
                />
                <FormControl.HelpText>
                  Help text with{' '}
                  <TextLink href="#" icon={<LinkSimpleIcon />} alignIcon="end">
                    link out
                  </TextLink>
                </FormControl.HelpText>
              </FormControl>

              <FormControl isRequired>
                <FormControl.Label>Your website URL</FormControl.Label>
                <TextInput
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="http://www..."
                />
                <FormControl.HelpText>Help text</FormControl.HelpText>
              </FormControl>
            </Form>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
};

export default ConfigScreen;
