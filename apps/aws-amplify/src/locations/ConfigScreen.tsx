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
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import tokens from '@contentful/f36-tokens';
import AmplifyIcon from '../components/common/AmplifyIcon';

export interface AppInstallationParameters {}

export const AWSAmplifyBrand = {
  primaryColor: '#232F3E',
  url: 'https://aws.amazon.com/amplify/',
  logoImage: '',
};

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
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const sdk = useSDK<ConfigAppSDK>();
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    // TODO persist webhook url
    console.log({ webhookUrl });

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, webhookUrl, sdk]);

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

  const handleWebhookChange = (e: ChangeEvent<HTMLInputElement>) => {
    setWebhookUrl(e.target.value);
  };

  return (
    <>
      <Box className={styles.background} />
      <Box className={styles.body}>
        <Box>
          <Heading>Set up AWS Amplify</Heading>
          <Paragraph>
            Amplify is a set of purpose-built tools and features that enables frontend web and
            mobile developers to quickly and easily build full-stack applications on AWS.
          </Paragraph>
        </Box>
        <Stack spacing="spacingL" flexDirection="column">
          <Box style={styles.box}>
            <FormControl id="webhookUrl" isRequired={true}>
              <FormControl.Label>AWS Amplify Webhook URL</FormControl.Label>
              <TextInput
                spellCheck={false}
                name="webhookUrl"
                placeholder={'https://webhooks.amplify.us-east-1.amazonaws.com'}
                value={webhookUrl}
                onChange={handleWebhookChange}
              />
              <HelpText>
                Follow{' '}
                <TextLink
                  // icon={<ExternalLinkTrimmedIcon />}
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
