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
import { css } from 'emotion';
import { useSDK } from '@contentful/react-apps-toolkit';
import tokens from '@contentful/f36-tokens';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import AmplifyIcon, { AWSAmplifyBrand } from '../components/common/AmplifyIcon';
import { isValidUrl } from '../lib/isVaildUrl';

export interface AppInstallationParameters {
  amplifyWebhookUrl?: string;
}

export const styles = {
  body: css({
    height: 'auto',
    minHeight: '40vh',
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
  box: {
    width: '100%',
    marginTop: '22px',
  },
  icon: {
    marginTop: '41px',
  },
};

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
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

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
