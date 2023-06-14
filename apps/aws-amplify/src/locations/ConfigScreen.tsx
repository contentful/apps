import { useCallback, useState, useEffect, ChangeEvent } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Flex,
  FormControl,
  Heading,
  HelpText,
  Paragraph,
  Stack,
  TextInput,
  TextLink,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { isValidUrl } from '../lib/isVaildUrl';
import { styles } from '../components/config-screen/ConfigScreen.styles';
import AmplifyIcon from '../components/common/AmplifyIcon';

export interface AppInstallationParameters {
  amplifyWebhookUrl?: string;
}

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const [amplifyWebhookUrl, setAmplifyWebhookUrl] = useState<string>('');

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    if (!isValidUrl(amplifyWebhookUrl)) {
      sdk.notifier.error('Please provide a valid webhook URL.');
      return false;
    }

    const parametersToSave = {
      ...parameters,
      amplifyWebhookUrl,
    };

    setParameters(parametersToSave);

    return {
      parameters: parametersToSave,
      targetState: currentState,
    };
  }, [parameters, sdk, amplifyWebhookUrl]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      if (currentParameters?.amplifyWebhookUrl) {
        setAmplifyWebhookUrl(currentParameters.amplifyWebhookUrl);
      }

      sdk.app.setReady();
    })();
  }, [sdk]);

  const handleWebhookChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAmplifyWebhookUrl(e.target.value);
  };

  return (
    <>
      <Box className={styles.background} />
      <Box className={styles.body}>
        <Box>
          <Heading>Set Up AWS Amplify</Heading>
          <Paragraph>
            Amplify is a set of purpose-built tools and features that enables frontend web and
            mobile developers to quickly and easily build full-stack applications on AWS.
          </Paragraph>
        </Box>
        <Stack spacing="spacingL" flexDirection="column">
          <Box style={styles.box}>
            <FormControl id="webhookUrl" isRequired={true}>
              <FormControl.Label aria-label="webhookUrl" htmlFor="webhookUrl">
                AWS Amplify Webhook URL
              </FormControl.Label>
              <TextInput
                testId="webhookUrl"
                spellCheck={false}
                name="webhookUrl"
                placeholder={'ex. https://webhooks.amplify.us-east-1.amazonaws.com/...'}
                value={amplifyWebhookUrl}
                onChange={handleWebhookChange}
              />
              <HelpText>
                Follow{' '}
                <TextLink
                  icon={<ExternalLinkIcon />}
                  alignIcon="end"
                  href="https://docs.aws.amazon.com/amplify/latest/userguide/webhooks.html"
                  target="_blank"
                  rel="noopener noreferrer">
                  these detailed instructions
                </TextLink>{' '}
                to create a webhook in the AWS Amplify dashboard.
              </HelpText>
            </FormControl>
          </Box>
        </Stack>
      </Box>
      <Box style={styles.icon}>
        <Flex alignItems="center" justifyContent="center">
          <AmplifyIcon />
        </Flex>
      </Box>
    </>
  );
};

export default ConfigScreen;
