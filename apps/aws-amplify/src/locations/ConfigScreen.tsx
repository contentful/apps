import { useCallback, useState, useEffect, ChangeEvent } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Button,
  Card,
  Flex,
  FormControl,
  Heading,
  Note,
  Paragraph,
  Stack,
  TextInput,
  TextLink,
} from '@contentful/f36-components';
import { css } from 'emotion';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import tokens from '@contentful/f36-tokens';

export interface AppInstallationParameters {}

export const AWSAmplifyBrand = {
  primaryColor: '#187CAB',
  url: 'https://aws.amazon.com/amplify/',
  logoImage: '',
};

export const styles = {
  body: css({
    height: 'auto',
    minHeight: '65vh',
    margin: '0 auto',
    marginTop: tokens.spacingXl,
    padding: `${tokens.spacingXl} ${tokens.spacing2Xl}`,
    maxWidth: '900px',
    backgroundColor: tokens.colorWhite,
    zIndex: 2,
    boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)',
    borderRadius: '2px',
  }),
  background: css({
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    top: 0,
    width: '100%',
    height: '300px',
    backgroundColor: AWSAmplifyBrand.primaryColor,
  }),
};

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const sdk = useSDK<ConfigAppSDK>();
  const [webhookUrl, setWebhookUrl] = useState('');
  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

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

  const handleWebhookChangeUrl = (e: ChangeEvent<HTMLInputElement>) => {
    setWebhookUrl(e.target.value);
  };

  const handleWebhookSave = () => {
    console.log(webhookUrl);
  };

  return (
    <>
      <Box className={styles.background} />
      <Box className={styles.body}>
        <Box>
          <Heading>About AWS Amplify for Contentful</Heading>
          <Paragraph>AWS Amplify is the business.</Paragraph>
        </Box>
        <Stack spacing="spacingL" flexDirection="column">
          <Card>
            <Box marginBottom="spacingM">
              <Note variant="primary">
                Follow{' '}
                <TextLink
                  // icon={<ExternalLinkTrimmedIcon />}
                  alignIcon="end"
                  href="https://aws.amazon.com/amplify/"
                  target="_blank"
                  rel="noopener noreferrer">
                  these detailed instructions
                </TextLink>{' '}
                to create a webhook in the AWS amplify dashboard.
              </Note>
            </Box>
            <FormControl id="webhookUrl" isRequired={true}>
              <FormControl.Label>AWS Amplify Webhook URL</FormControl.Label>
              <TextInput
                spellCheck={false}
                name="webhookUrl"
                placeholder={'https://www.example/webhook'}
                value={webhookUrl}
                onChange={handleWebhookChangeUrl}
              />
            </FormControl>
            <Flex flexDirection="column" alignItems="end">
              <Button onClick={handleWebhookSave}>Save</Button>
            </Flex>
          </Card>
        </Stack>
      </Box>
    </>
  );
};

export default ConfigScreen;
