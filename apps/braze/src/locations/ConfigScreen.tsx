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
  Text,
  Spacing,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useState } from 'react';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { styles } from './ConfigScreen.styles';
import Splitter from '../components/Splitter';

export interface AppInstallationParameters {
  contentfulApiKey: string;
  brazeApiKey: string;
}

export const BRAZE_CONNECTED_CONTENT_DOCUMENTATION =
  'https://braze.com/docs/user_guide/personalization_and_dynamic_content/connected_content';
export const BRAZE_APP_DOCUMENTATION = 'https://www.contentful.com/help/apps/braze-app/';
export const CONTENT_TYPE_DOCUMENTATION =
  'https://www.contentful.com/help/content-types/configure-content-type/';
const BRAZE_API_KEY_DOCUMENTATION = `https://dashboard.braze.com/app_settings/developer_console/apisettings#apikeys`;

export async function callTo(url: string, newApiKey: string) {
  return await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${newApiKey}`,
      'Content-Type': 'application/json',
    },
  });
}

const ConfigScreen = () => {
  const [contentfulApiKeyIsValid, contentfulSetApiKeyIsValid] = useState(true);
  const [brazeApiKeyIsValid, brazeSetApiKeyIsValid] = useState(true);
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    contentfulApiKey: '',
    brazeApiKey: '',
  });
  const sdk = useSDK<ConfigAppSDK>();
  const spaceId = sdk.ids.space;

  async function checkContentfulApiKey(apiKey: string) {
    if (!apiKey) {
      contentfulSetApiKeyIsValid(false);
      return false;
    }

    const url = `https://${sdk.hostnames.delivery}/spaces/${sdk.ids.space}`;
    const response: Response = await callTo(url, apiKey);

    const isValid = response.ok;
    contentfulSetApiKeyIsValid(isValid);

    return isValid;
  }

  async function checkBrazeApiKey(apiKey: string) {
    const hasAValue = !!apiKey?.trim();
    brazeSetApiKeyIsValid(hasAValue);

    // TODO : See how to check if the api key is valid, we cannot add a fetch here because the api key is for reading and also writing

    return hasAValue;
  }

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    const isContentfulKeyValid = await checkContentfulApiKey(parameters.contentfulApiKey);
    const isBrazeKeyValid = await checkBrazeApiKey(parameters.brazeApiKey);

    if (!isContentfulKeyValid || !isBrazeKeyValid) {
      sdk.notifier.error('A valid API key is required');
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

  return (
    <Flex justifyContent="center" alignContent="center">
      <Box className={styles.body} marginTop="spacingL" padding="spacingL">
        <Heading marginBottom="spacingS">Set up Braze</Heading>
        <InformationSection
          url={BRAZE_CONNECTED_CONTENT_DOCUMENTATION}
          linkText="Braze's Connected Content feature">
          The Braze app allows editors to connect content stored in Contentful to Braze campaigns
          through
        </InformationSection>
        <InformationSection url={BRAZE_APP_DOCUMENTATION} linkText="here" marginTop="spacingL">
          Learn more about how to connect Contentful with Braze and configure the Braze app
        </InformationSection>
        <Splitter marginTop="spacingL" marginBottom="spacingL" />
        <Heading marginBottom="spacingL">Connected Content configuration</Heading>
        <Subheading className={styles.subheading}>Input the Contentful Delivery API</Subheading>
        <InformationSection
          url={`https://app.contentful.com/spaces/${spaceId}/api/keys`}
          linkText="Manage API Keys">
          Input the Contentful API key that Braze will use to request your content via API at send
          time.
        </InformationSection>
        <Box marginTop="spacingM" marginBottom="spacingM">
          <Form>
            <FormControl.Label>Contentful Delivery API - access token</FormControl.Label>
            <TextInput
              value={parameters.contentfulApiKey}
              name="contentfulApiKey"
              data-testid="contentfulApiKey"
              isInvalid={!contentfulApiKeyIsValid}
              placeholder="ex. 0ab1c234DE56f..."
              type="password"
              onChange={(e) => setParameters({ ...parameters, contentfulApiKey: e.target.value })}
            />
            {!contentfulApiKeyIsValid && (
              <FormControl.ValidationMessage>Invalid API key</FormControl.ValidationMessage>
            )}
          </Form>
        </Box>
        <Splitter marginTop="spacingL" marginBottom="spacingL" />
        <Subheading className={styles.subheading}>Content Blocks configuration</Subheading>
        <Paragraph marginBottom="spacing2Xs">
          {' '}
          Connect specific entry fields stored in Contentful to create Content Blocks in Braze
          through
        </Paragraph>
        <TextLink
          icon={<ExternalLinkIcon />}
          alignIcon="end"
          href={BRAZE_API_KEY_DOCUMENTATION}
          target="_blank"
          rel="noopener noreferrer">
          Braze's Content Block feature
        </TextLink>
        <span>.</span>
        <Box marginTop="spacingM">
          <Form>
            <FormControl.Label>Braze REST API key</FormControl.Label>
            <TextInput
              value={parameters.brazeApiKey}
              name="brazeApiKey"
              data-testid="brazeApiKey"
              isInvalid={!brazeApiKeyIsValid}
              placeholder="ex. 0ab1c234DE56f..."
              type="password"
              onChange={(e) => setParameters({ ...parameters, brazeApiKey: e.target.value })}
            />
            {!brazeApiKeyIsValid && (
              <FormControl.ValidationMessage>Invalid API key</FormControl.ValidationMessage>
            )}
          </Form>
        </Box>
        <Subheading className={styles.subheading}>Add Braze to your content types</Subheading>
        <InformationSection url={CONTENT_TYPE_DOCUMENTATION} linkText="here" marginTop="spacing2Xs">
          Navigate to the content type you would like to use under the Content model tab in the main
          navigation. Select the content type and adjust the sidebar settings on the Sidebar tab.
          Learn more about configuring your content type
        </InformationSection>
      </Box>
    </Flex>
  );
};

type InformationSectionProps = {
  url: string;
  children: string;
  linkText: string;
  marginTop?: Spacing;
  marginBottom?: Spacing;
};
function InformationSection(props: InformationSectionProps) {
  return (
    <Paragraph
      marginBottom={props.marginBottom ? props.marginBottom : 'spacing2Xs'}
      marginTop={props.marginTop ? props.marginTop : 'spacingXs'}>
      {`${props.children} `}
      <TextLink
        icon={<ExternalLinkIcon />}
        alignIcon="end"
        href={props.url}
        target="_blank"
        data-testid={props.url}
        rel="noopener noreferrer">
        {props.linkText}
      </TextLink>
      <Text> .</Text>
    </Paragraph>
  );
}

export default ConfigScreen;
