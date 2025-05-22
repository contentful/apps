import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Flex,
  Form,
  FormControl,
  Heading,
  TextInput,
  Text,
  Subheading,
  Select,
  Note,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useState } from 'react';
import { styles } from './ConfigScreen.styles';
import Splitter from '../components/Splitter';
import {
  BRAZE_API_KEY_DOCUMENTATION,
  BRAZE_APP_DOCUMENTATION,
  BRAZE_CONTENT_BLOCK_DOCUMENTATION,
  BRAZE_ENDPOINTS,
  BRAZE_ENDPOINTS_DOCUMENTATION,
  BrazeEndpoint,
  CONFIG_CONTENT_TYPE_ID,
  CONFIG_ENTRY_ID,
  CONFIG_FIELD_ID,
  CONTENT_TYPE_DOCUMENTATION,
} from '../utils';
import InformationWithLink from '../components/InformationWithLink';
import { createClient, PlainClientAPI } from 'contentful-management';

export interface AppInstallationParameters {
  contentfulApiKey: string;
  brazeApiKey: string;
  brazeEndpoint: string;
}

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
  const [brazeApiKeyIsValid, setBrazeApiKeyIsValid] = useState(true);
  const [brazeEndpointIsValid, setBrazeEndpointIsValid] = useState(true);
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    contentfulApiKey: '',
    brazeApiKey: '',
    brazeEndpoint: '',
  });
  const sdk = useSDK<ConfigAppSDK>();
  const spaceId = sdk.ids.space;

  const cma = createClient(
    { apiAdapter: sdk.cmaAdapter },
    {
      type: 'plain',
      defaults: {
        environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
        spaceId: sdk.ids.space,
      },
    }
  );

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

  function checkIfHasValue(value: string, setIsValid: (valid: boolean) => void) {
    const hasValue = !!value?.trim();
    setIsValid(hasValue);
    return hasValue;
  }

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    const isContentfulKeyValid = await checkContentfulApiKey(parameters.contentfulApiKey);
    const isBrazeKeyValid = checkIfHasValue(parameters.brazeApiKey, setBrazeApiKeyIsValid);

    const isBrazeEndpointValid = checkIfHasValue(parameters.brazeEndpoint, setBrazeEndpointIsValid);

    if (!isContentfulKeyValid || !isBrazeKeyValid || !isBrazeEndpointValid) {
      sdk.notifier.error('Some fields are missing or invalid');
      return false;
    }

    try {
      await createContentType(cma);
    } catch (e) {
      console.error(e);
      sdk.notifier.error('Error creating content type for configuration');
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
        <Heading marginBottom="spacingXs">Set up Braze</Heading>
        <InformationWithLink
          url={BRAZE_APP_DOCUMENTATION}
          linkText="here"
          dataTestId="braze-app-docs-here">
          Learn more about how to connect Contentful with Braze and configure the Braze app
        </InformationWithLink>
        <Box marginTop="spacingL" marginBottom="spacingL">
          <Note variant="neutral">
            The Braze app will create a content type labeled "brazeConfig". Do not delete or modify
            manually.
          </Note>
        </Box>
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
          brazeEndpointIsValid={brazeEndpointIsValid}
          setParameters={setParameters}
        />
      </Box>
    </Flex>
  );
};

async function createContentType(cma: PlainClientAPI) {
  try {
    await cma.contentType.get({
      contentTypeId: CONFIG_CONTENT_TYPE_ID,
    });
    return;
  } catch (e) {}

  const contentTypeBody = {
    name: CONFIG_CONTENT_TYPE_ID,
    description: 'Content Type used by the Braze app. Do not delete or modify manually.',
    fields: [
      {
        id: CONFIG_FIELD_ID,
        name: CONFIG_FIELD_ID,
        required: false,
        localized: false,
        type: 'Object',
      },
    ],
  };
  const contentTypeProps = await cma.contentType.createWithId(
    { contentTypeId: CONFIG_CONTENT_TYPE_ID },
    contentTypeBody
  );
  await cma.contentType.publish({ contentTypeId: CONFIG_CONTENT_TYPE_ID }, contentTypeProps);
  await cma.entry.createWithId(
    { contentTypeId: CONFIG_CONTENT_TYPE_ID, entryId: CONFIG_ENTRY_ID },
    { fields: {} }
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
      <InformationWithLink
        url={`https://app.contentful.com/spaces/${props.spaceId}/api/keys`}
        linkText="Manage API Keys">
        Input the Contentful API key that Braze will use to request your content via API at send
        time.
      </InformationWithLink>
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
      <InformationWithLink
        url={CONTENT_TYPE_DOCUMENTATION}
        linkText="here"
        marginTop="spacing2Xs"
        dataTestId="content-type-docs-here">
        Navigate to the content type you would like to use under the Content model tab in the main
        navigation. Select the content type and adjust the sidebar settings on the Sidebar tab.
        Learn more about configuring your content type
      </InformationWithLink>
    </>
  );
}

type ContentBlockSectionProps = {
  parameters: AppInstallationParameters;
  brazeApiKeyIsValid: boolean;
  brazeEndpointIsValid: boolean;
  setParameters: (e: any) => void;
};

function ContentBlockSection({
  parameters,
  brazeApiKeyIsValid,
  brazeEndpointIsValid,
  setParameters,
}: ContentBlockSectionProps) {
  const handleSelectItem = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setParameters({ ...parameters, brazeEndpoint: e.target.value });
  };

  return (
    <>
      <Heading marginBottom="spacing2Xs">Content Blocks configuration</Heading>
      <InformationWithLink
        url={BRAZE_CONTENT_BLOCK_DOCUMENTATION}
        linkText="Braze's Content Block feature">
        Connect specific entry fields stored in Contentful to create Content Blocks in Braze through
      </InformationWithLink>
      <Box marginTop="spacingM">
        <Form>
          <FormControl.Label>Braze REST API key</FormControl.Label>
          <Text fontColor="gray500"> (required)</Text>
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
      <InformationWithLink
        marginBottom="spacingL"
        fontColor="gray500"
        linkText="Braze REST API Keys page"
        url={BRAZE_API_KEY_DOCUMENTATION}>
        Enter your Braze REST API key. If you need to generate a key, visit your
      </InformationWithLink>
      <Subheading className={styles.subheading}>Select your Braze REST endpoint</Subheading>
      <InformationWithLink
        linkText="here"
        dataTestId="rest-endpoints-here"
        url={BRAZE_ENDPOINTS_DOCUMENTATION}>
        View the URL of your Braze dashboard. Then, use it to determine the correct Braze REST
        endpoint. You can find a list of REST endpoint URLs
      </InformationWithLink>
      <Box marginTop="spacingM">
        <FormControl isRequired>
          <FormControl.Label>Braze REST endpoint</FormControl.Label>
          <Select
            value={parameters.brazeEndpoint}
            onChange={handleSelectItem}
            isInvalid={!brazeEndpointIsValid}
            data-testid="brazeEndpoint">
            <Select.Option value="">Select one</Select.Option>
            {BRAZE_ENDPOINTS.map((endpoint) => (
              <Select.Option key={endpoint.url} value={endpoint.url}>
                {endpoint.name}
              </Select.Option>
            ))}
          </Select>
          {!brazeEndpointIsValid && (
            <FormControl.ValidationMessage>Invalid REST Endpoint</FormControl.ValidationMessage>
          )}
        </FormControl>
      </Box>
    </>
  );
}

export default ConfigScreen;
