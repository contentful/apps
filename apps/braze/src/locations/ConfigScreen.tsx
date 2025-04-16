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
import { ColorTokens } from '@contentful/f36-tokens';

export interface AppInstallationParameters {
  contentfulApiKey: string;
  brazeApiKey: string;
}

export const BRAZE_APP_DOCUMENTATION = 'https://www.contentful.com/help/apps/braze-app/';
export const BRAZE_API_KEY_DOCUMENTATION = `https://dashboard.braze.com/app_settings/developer_console/apisettings#apikeys`;
export const BRAZE_CONNECTED_CONTENT_DOCUMENTATION =
  'https://braze.com/docs/user_guide/personalization_and_dynamic_content/connected_content';
export const CONTENT_TYPE_DOCUMENTATION =
  'https://www.contentful.com/help/content-types/configure-content-type/';
export const BRAZE_CONTENT_BLOCK_DOCUMENTATION =
  'https://www.braze.com/docs/api/endpoints/templates/content_blocks_templates/post_create_email_content_block';

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
      <Box className={styles.body} marginTop="spacingS" marginBottom="spacingS" padding="spacingL">
        <TitleSection />
        <Splitter marginTop="spacingL" marginBottom="spacingL" />
        <ContentTypeSection />
        <Splitter marginTop="spacingL" marginBottom="spacingL" />
        <ConnectedContentSection
          spaceId={spaceId}
          parameters={parameters}
          contentfulApiKeyIsValid={contentfulApiKeyIsValid}
          onChange={(e) => setParameters({ ...parameters, contentfulApiKey: e.target.value })}
        />
        <Splitter marginTop="spacingL" marginBottom="spacingL" />
        <ContentBlockSection
          parameters={parameters}
          brazeApiKeyIsValid={brazeApiKeyIsValid}
          onChange={(e) => setParameters({ ...parameters, brazeApiKey: e.target.value })}
        />
      </Box>
    </Flex>
  );
};

function TitleSection() {
  return (
    <>
      <Heading marginBottom="spacingXs">Set up Braze</Heading>
      <InformationSection
        url={BRAZE_APP_DOCUMENTATION}
        linkText="here"
        dataTestId="braze-app-docs-here-link">
        Learn more about how to connect Contentful with Braze and configure the Braze app
      </InformationSection>
    </>
  );
}

function ConnectedContentSection(props: {
  spaceId: string;
  parameters: AppInstallationParameters;
  contentfulApiKeyIsValid: boolean;
  onChange: (e: any) => void;
}) {
  return (
    <>
      <Heading marginBottom="spacing2Xs">Connected Content configuration</Heading>
      <InformationSection
        url={`https://app.contentful.com/spaces/${props.spaceId}/api/keys`}
        linkText="Manage API Keys">
        Input the Contentful API key that Braze will use to request your content via API at send
        time.
      </InformationSection>
      <Box marginTop="spacingM">
        <Form>
          <FormControl.Label>Contentful Delivery API - access token</FormControl.Label>
          <Text fontColor="gray500"> (required)</Text>
          <TextInput
            value={props.parameters.contentfulApiKey}
            name="contentfulApiKey"
            data-testid="contentfulApiKey"
            isInvalid={!props.contentfulApiKeyIsValid}
            placeholder="ex. 0ab1c234DE56f..."
            type="password"
            onChange={props.onChange}
          />
          {!props.contentfulApiKeyIsValid && (
            <FormControl.ValidationMessage>Invalid API key</FormControl.ValidationMessage>
          )}
        </Form>
      </Box>
    </>
  );
}

function ContentTypeSection() {
  return (
    <>
      <Heading marginBottom="spacing2Xs">Add Braze to your content types</Heading>
      <InformationSection
        url={CONTENT_TYPE_DOCUMENTATION}
        linkText="here"
        marginTop="spacing2Xs"
        dataTestId="content-type-docs-here-link">
        Select the content type(s) you would like to use with Braze. You can update this by
        adjusting the settings in the content type menu under the Sidebar tab. Learn more about
        configuring your content type
      </InformationSection>
      <Box marginTop="spacingM">
        <Form>
          <FormControl.Label>Select content type(s)</FormControl.Label>
          {/* TODO : Implement autocomplete */}
          <TextInput name="content-type" data-testid="content-type-input" placeholder="Search" />
        </Form>
      </Box>
    </>
  );
}

function ContentBlockSection(props: {
  parameters: AppInstallationParameters;
  brazeApiKeyIsValid: boolean;
  onChange: (e: any) => void;
}) {
  return (
    <>
      <Heading marginBottom="spacing2Xs">Content Blocks configuration</Heading>
      <InformationSection
        url={BRAZE_CONTENT_BLOCK_DOCUMENTATION}
        linkText="Braze's Content Block feature">
        Connect specific entry fields stored in Contentful to create Content Blocks in Braze through
      </InformationSection>
      <Box marginTop="spacingM">
        <Form>
          <FormControl.Label>Braze REST API key</FormControl.Label>
          <Text fontColor="gray500"> (required)</Text>
          <TextInput
            value={props.parameters.brazeApiKey}
            name="brazeApiKey"
            data-testid="brazeApiKey"
            isInvalid={!props.brazeApiKeyIsValid}
            placeholder="ex. 0ab1c234DE56f..."
            type="password"
            onChange={props.onChange}
          />
          {!props.brazeApiKeyIsValid && (
            <FormControl.ValidationMessage>Invalid API key</FormControl.ValidationMessage>
          )}
        </Form>
      </Box>
      <InformationSection
        fontColor="gray500"
        linkText="Braze REST API Keys page"
        url={BRAZE_API_KEY_DOCUMENTATION}>
        Enter your Braze REST API key. If you need to generate a key, visit your
      </InformationSection>
    </>
  );
}

type InformationSectionProps = {
  url: string;
  children: string;
  linkText: string;
  marginTop?: Spacing;
  marginBottom?: Spacing;
  fontColor?: ColorTokens | undefined;
  dataTestId?: string;
};
function InformationSection(props: InformationSectionProps) {
  return (
    <Paragraph
      fontColor={props.fontColor}
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
