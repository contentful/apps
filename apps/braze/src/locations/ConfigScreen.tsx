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
  apiKey: string;
}

export const BRAZE_CONNECTED_CONTENT_DOCUMENTATION =
  'https://braze.com/docs/user_guide/personalization_and_dynamic_content/connected_content';
export const BRAZE_APP_DOCUMENTATION = 'https://www.contentful.com/help/apps/braze-app/';
export const CONTENT_TYPE_DOCUMENTATION =
  'https://www.contentful.com/help/content-types/configure-content-type/';

export async function callToContentful(sdk: ConfigAppSDK, apiKey: string) {
  const url = `https://${sdk.hostnames.delivery}/spaces/${sdk.ids.space}/environments/${sdk.ids.environment}/entries?access_token=${apiKey}`;
  return await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

const ConfigScreen = () => {
  const [apiKeyIsValid, setApiKeyIsValid] = useState(true);
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    apiKey: '',
  });
  const sdk = useSDK<ConfigAppSDK>();
  const spaceId = sdk.ids.space;

  async function checkApiKey(apiKey: string) {
    if (!apiKey) {
      setApiKeyIsValid(false);
      return false;
    }

    const response: Response = await callToContentful(sdk, apiKey);

    const isValid = response.ok;
    setApiKeyIsValid(isValid);

    return isValid;
  }

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    const isValid = await checkApiKey(parameters.apiKey);

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
        <InformationSection
          url={BRAZE_APP_DOCUMENTATION}
          linkText="here"
          marginTop="spacingL"
          dataTestId="braze-app-docs-here-link">
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
              value={parameters.apiKey}
              name="apiKey"
              data-testid="apiKey"
              isInvalid={!apiKeyIsValid}
              placeholder="ex. 0ab1c234DE56f..."
              type="password"
              onChange={(e) => setParameters({ ...parameters, apiKey: e.target.value })}
            />
            {!apiKeyIsValid && (
              <FormControl.ValidationMessage>Invalid API key</FormControl.ValidationMessage>
            )}
          </Form>
        </Box>
        <Subheading className={styles.subheading}>Add Braze to your content types</Subheading>
        <InformationSection
          url={CONTENT_TYPE_DOCUMENTATION}
          linkText="here"
          marginTop="spacing2Xs"
          dataTestId="content-type-docs-here-link">
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
  dataTestId?: string;
};
function InformationSection(props: InformationSectionProps) {
  return (
    <Paragraph
      marginBottom={props.marginBottom ? props.marginBottom : 'spacing2Xs'}
      marginTop={props.marginTop ? props.marginTop : 'spacingXs'}>
      {props.children}{' '}
      <TextLink
        icon={<ExternalLinkIcon />}
        alignIcon="end"
        href={props.url}
        target="_blank"
        data-testid={props.dataTestId}
        rel="noopener noreferrer">
        {props.linkText}
      </TextLink>
      <Text> .</Text>
    </Paragraph>
  );
}

export default ConfigScreen;
