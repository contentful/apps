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
  Stack,
  Autocomplete,
  Paragraph,
  Pill,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useState } from 'react';
import { styles } from './ConfigScreen.styles';
import Splitter from '../components/Splitter';
import {
  AppInstallationParameters,
  BRAZE_API_KEY_DOCUMENTATION,
  BRAZE_APP_DOCUMENTATION,
  BRAZE_CONTENT_BLOCK_DOCUMENTATION,
  BRAZE_ENDPOINTS,
  BRAZE_ENDPOINTS_DOCUMENTATION,
  CONFIG_CONTENT_TYPE_ID,
  CONFIG_ENTRY_ID,
  CONFIG_FIELD_ID,
  CONTENT_TYPE_DOCUMENTATION,
} from '../utils';
import InformationWithLink from '../components/InformationWithLink';
import { ContentTypeProps, createClient, PlainClientAPI } from 'contentful-management';

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
  const [selectedContentTypes, setSelectedContentTypes] = useState<{ id: string; name: string }[]>(
    []
  );
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
      await createContentType(sdk, cma);
    } catch (e) {
      console.error(e);
      sdk.notifier.error('Error creating content type for configuration');
      return false;
    }
    await addAppToSidebar(
      sdk,
      cma,
      selectedContentTypes.map((contentType) => contentType.id)
    );

    const editorInterface = selectedContentTypes.reduce((acc, contentType) => {
      return {
        ...acc,
        [contentType.id]: {
          sidebar: { position: 0 },
        },
      };
    }, {});

    return {
      parameters,
      targetState: { EditorInterface: { ...currentState?.EditorInterface, ...editorInterface } },
    };
  }, [parameters, sdk, cma, selectedContentTypes]);

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
        <ContentTypeSection
          selectedContentTypes={selectedContentTypes}
          setSelectedContentTypes={setSelectedContentTypes}
          cma={cma}
          sdk={sdk}
        />
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

async function createContentType(sdk: ConfigAppSDK, cma: PlainClientAPI) {
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

async function addAppToSidebar(sdk: ConfigAppSDK, cma: PlainClientAPI, contentTypesId: string[]) {
  for (const contentTypeId of contentTypesId) {
    try {
      const editorInterface = await cma.editorInterface.get({ contentTypeId });
      const updatedSidebar = [
        ...(editorInterface.sidebar || []),
        {
          widgetId: sdk.ids.app,
          widgetNamespace: 'app',
          settings: { position: 0 },
        },
      ];

      await cma.editorInterface.update(
        { contentTypeId },
        {
          ...editorInterface,
          sidebar: updatedSidebar,
        }
      );
    } catch (e) {
      sdk.notifier.error(`Failed to add app to sidebar for content type ${contentTypeId}`);
    }
  }
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

function ContentTypeSection(props: {
  selectedContentTypes: { id: string; name: string }[];
  setSelectedContentTypes: (contentTypes: { id: string; name: string }[]) => void;
  cma: PlainClientAPI;
  sdk: ConfigAppSDK;
}) {
  const { selectedContentTypes, setSelectedContentTypes, cma, sdk } = props;
  const [availableContentTypes, setAvailableContentTypes] = useState<
    { id: string; name: string }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAllContentTypes = async (): Promise<ContentTypeProps[]> => {
    let allContentTypes: ContentTypeProps[] = [];
    let skip = 0;
    const limit = 1000;
    let areMoreContentTypes = true;

    while (areMoreContentTypes) {
      const response = await cma.contentType.getMany({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        query: { skip, limit },
      });
      if (response.items) {
        allContentTypes = allContentTypes.concat(response.items as ContentTypeProps[]);
        areMoreContentTypes = response.items.length === limit;
      } else {
        areMoreContentTypes = false;
      }
      skip += limit;
    }

    return allContentTypes;
  };

  useEffect(() => {
    (async () => {
      const currentState = await sdk.app.getCurrentState();
      const currentContentTypesIds = Object.keys(currentState?.EditorInterface || {});
      const excludedContentTypesIds = [CONFIG_CONTENT_TYPE_ID];

      const allContentTypes = await fetchAllContentTypes();

      const newAvailableContentTypes = allContentTypes
        .filter((ct) => !excludedContentTypesIds.includes(ct.sys.id))
        .map((ct) => ({
          id: ct.sys.id,
          name: ct.name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setAvailableContentTypes(newAvailableContentTypes);

      // If we have current content types, set them as selected
      if (currentContentTypesIds.length > 0) {
        const currentContentTypes = allContentTypes
          .filter((ct) => currentContentTypesIds.includes(ct.sys.id))
          .map((ct) => ({ id: ct.sys.id, name: ct.name }));
        setSelectedContentTypes(currentContentTypes);
      }
    })();
  }, []);

  const filteredContentTypes = availableContentTypes.filter(
    (contentType) =>
      !selectedContentTypes.some((selected) => selected.id === contentType.id) &&
      contentType.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectItem = (item: { id: string; name: string }) => {
    setSelectedContentTypes([...selectedContentTypes, item]);
  };

  const handleUnselectItem = (item: { id: string; name: string }) => {
    setSelectedContentTypes(
      selectedContentTypes.filter((contentType) => contentType.id !== item.id)
    );
  };

  const isAllSelected = selectedContentTypes.length === availableContentTypes.length;

  return (
    <>
      <Heading marginBottom="spacing2Xs">Add Braze to your content types</Heading>
      <InformationWithLink
        url={CONTENT_TYPE_DOCUMENTATION}
        linkText="here"
        marginTop="spacing2Xs"
        dataTestId="content-type-docs-here">
        Select the content type(s) you would like to use with Braze. You can update this by
        adjusting the settings in the content type menu under the Sidebar tab. Learn more about
        configuring your content type
      </InformationWithLink>
      <Stack flexDirection="column" alignItems="start">
        <Autocomplete<{ id: string; name: string }>
          items={filteredContentTypes}
          onInputValueChange={setSearchQuery}
          onSelectItem={handleSelectItem}
          placeholder={isAllSelected ? 'All content types have been selected' : 'Search'}
          isDisabled={isAllSelected}
          itemToString={(item) => item.name}
          renderItem={(item) => <Text fontWeight="fontWeightDemiBold">{item.name}</Text>}
          textOnAfterSelect="clear"
          closeAfterSelect={false}
          listWidth="full"
        />

        {selectedContentTypes.length > 0 && (
          <Box width="full" overflow="auto">
            <Paragraph>Selected content types:</Paragraph>
            <Flex flexDirection="row" gap="spacing2Xs" flexWrap="wrap">
              {selectedContentTypes.map((contentType, index) => (
                <Pill
                  key={index}
                  label={contentType.name}
                  isDraggable={false}
                  onClose={() => handleUnselectItem(contentType)}
                  data-testid={`pill-${contentType.id}`}
                />
              ))}
            </Flex>
          </Box>
        )}
      </Stack>
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
      <Paragraph fontColor={'gray500'} marginBottom={'spacingL'} marginTop={'spacingXs'}>
        Enter your Braze REST API key. If you need to generate a key, visit the APIs and Identifiers
        page under Settings on your Braze dashboard.
      </Paragraph>
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
