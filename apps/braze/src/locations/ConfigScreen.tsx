import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Flex,
  Form,
  FormControl,
  Heading,
  Paragraph,
  Subheading,
  TextInput,
  TextLink,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useState } from 'react';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { styles } from './ConfigScreen.styles';
import Splitter from '../components/Splitter';

export interface AppInstallationParameters {
  apiKey: string;
}

export const BRAZE_DOCUMENTATION =
  'https://braze.com/docs/user_guide/personalization_and_dynamic_content/connected_content';
export const BRAZE_BASE_URL = 'https://cdn.contentful.com/spaces/';

const ConfigScreen = () => {
  const [apiKeyValid, setApiKeyValid] = useState(false);
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    apiKey: '',
  });
  const sdk = useSDK<ConfigAppSDK>();
  const spaceId = sdk.ids.space;

  async function checkToken(newApiKey: string, displayNotification: boolean) {
    if (!newApiKey) {
      setApiKeyValid(false);
      return false;
    }

    const url = `${BRAZE_BASE_URL}${sdk.ids.space}`;
    const response: Response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${newApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const isValid = response.ok;
    setApiKeyValid(isValid);

    if (displayNotification) {
      isValid
        ? sdk.notifier.success(`Contentful API key was validated successfully`)
        : sdk.notifier.warning(`API key doesn't connect to Contentful`);
    }

    return isValid;
  }

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    const isValid = await checkToken(parameters.apiKey, false);

    if (!parameters.apiKey || !isValid) {
      sdk.notifier.error('A valid Contentful API key is required');
      return false;
    }

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

  useEffect(() => {
    const getData = setTimeout(() => checkToken(parameters.apiKey, true), 800);

    return () => clearTimeout(getData);
  }, [parameters.apiKey]);

  return (
    <Flex justifyContent="center" alignContent="center">
      <Box className={styles.body} marginTop="spacingL" padding="spacingL">
        <Heading marginBottom="spacingS">Set up Braze</Heading>
        <Paragraph marginBottom="spacing2Xs">
          The Braze app allows editors to connect content stored in Contentful to Braze campaigns
          through{' '}
        </Paragraph>
        <TextLink
          icon={<ExternalLinkIcon />}
          alignIcon="end"
          href={BRAZE_DOCUMENTATION}
          target="_blank"
          rel="noopener noreferrer">
          Braze's Connected Content feature
        </TextLink>
        <Splitter marginTop="spacingL" marginBottom="spacingL" />
        <Subheading className={styles.subheading}>Connected Content configuration</Subheading>
        <Paragraph marginBottom="spacing2Xs">
          {' '}
          Select the Contentful API key that Braze will use to request your content via API at send
          time.
        </Paragraph>
        <TextLink
          icon={<ExternalLinkIcon />}
          alignIcon="end"
          href={`https://app.contentful.com/spaces/${spaceId}/api/keys`}
          target="_blank"
          rel="noopener noreferrer">
          Manage API
        </TextLink>
        <Box marginTop="spacingM">
          <Form>
            <FormControl.Label>Contentful API key</FormControl.Label>
            <TextInput
              value={parameters.apiKey}
              name="apiKey"
              data-testid="apiKey"
              isInvalid={!apiKeyValid}
              placeholder="ex. 0ab1c234DE56f..."
              onChange={(e) => setParameters({ ...parameters, apiKey: e.target.value })}
            />
          </Form>
        </Box>
      </Box>
    </Flex>
  );
};

export default ConfigScreen;
