import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Flex,
  Form,
  FormControl,
  Heading,
  TextInput,
  Text,
  Paragraph,
  Note,
  Stack,
  Autocomplete,
  Pill,
  TextLink,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useState } from 'react';
import { ContentTypeProps, createClient, PlainClientAPI } from 'contentful-management';
import { AppInstallationParameters } from '../types';

const ELEVENLABS_DOCS_URL = 'https://elevenlabs.io/docs/api-reference/get-voices';

const ConfigScreen = () => {
  const [apiKeyIsValid, setApiKeyIsValid] = useState(true);
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    elevenLabsApiKey: '',
  });
  const [selectedContentTypes, setSelectedContentTypes] = useState<{ id: string; name: string }[]>(
    []
  );
  const sdk = useSDK<ConfigAppSDK>();

  const cma: PlainClientAPI = createClient(
    { apiAdapter: sdk.cmaAdapter },
    {
      type: 'plain',
      defaults: {
        environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
        spaceId: sdk.ids.space,
      },
    }
  );

  const validateApiKey = (apiKey: string): boolean => {
    // Basic validation - ElevenLabs API keys are typically non-empty strings
    const isValid = apiKey.trim().length > 0;
    setApiKeyIsValid(isValid);
    return isValid;
  };

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    const isApiKeyValid = validateApiKey(parameters.elevenLabsApiKey);

    if (!isApiKeyValid) {
      sdk.notifier.error('Please enter a valid ElevenLabs API key.');
      return false;
    }

    // Build editor interface for selected content types
    const editorInterface = selectedContentTypes.reduce(
      (acc, contentType) => ({
        ...acc,
        [contentType.id]: {
          sidebar: { position: 0 },
        },
      }),
      {}
    );

    return {
      parameters,
      targetState: { EditorInterface: { ...currentState?.EditorInterface, ...editorInterface } },
    };
  }, [parameters, sdk, selectedContentTypes]);

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
      <Box
        style={{ maxWidth: '800px', width: '100%' }}
        marginTop="spacingL"
        marginBottom="spacingL"
        padding="spacingL">
        <Heading marginBottom="spacingXs">Set up Broadcast</Heading>
        <Paragraph marginBottom="spacingL">
          Broadcast uses ElevenLabs Neural Text-to-Speech to generate audio from your content.
          Configure your API key below to get started.{' '}
          <TextLink href={ELEVENLABS_DOCS_URL} target="_blank" rel="noopener noreferrer">
            Learn more about ElevenLabs API
          </TextLink>
        </Paragraph>

        <Box marginBottom="spacingL">
          <Note variant="primary">
            Your ElevenLabs API key is stored securely and is never exposed to the browser. All API
            calls are made through secure backend functions.
          </Note>
        </Box>

        <ContentTypeSection
          selectedContentTypes={selectedContentTypes}
          setSelectedContentTypes={setSelectedContentTypes}
          cma={cma}
          sdk={sdk}
        />

        <Box
          marginTop="spacingL"
          marginBottom="spacingL"
          style={{ borderTop: '1px solid #e5e5e5', paddingTop: '24px' }}
        />

        <ApiKeySection
          parameters={parameters}
          apiKeyIsValid={apiKeyIsValid}
          onChange={(e) => setParameters({ ...parameters, elevenLabsApiKey: e.target.value })}
        />
      </Box>
    </Flex>
  );
};

interface ApiKeySectionProps {
  parameters: AppInstallationParameters;
  apiKeyIsValid: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function ApiKeySection({ parameters, apiKeyIsValid, onChange }: ApiKeySectionProps) {
  return (
    <>
      <Heading as="h2" marginBottom="spacing2Xs">
        ElevenLabs Configuration
      </Heading>
      <Paragraph marginBottom="spacingM">
        Enter your ElevenLabs API key. You can find this in your ElevenLabs account settings under
        the API section.
      </Paragraph>
      <Box marginTop="spacingM">
        <Form>
          <FormControl isRequired isInvalid={!apiKeyIsValid}>
            <FormControl.Label>ElevenLabs API Key</FormControl.Label>
            <TextInput
              value={parameters.elevenLabsApiKey}
              name="elevenLabsApiKey"
              data-testid="elevenLabsApiKey"
              isInvalid={!apiKeyIsValid}
              placeholder="Enter your ElevenLabs API key"
              type="password"
              onChange={onChange}
            />
            {!apiKeyIsValid && (
              <FormControl.ValidationMessage>
                Please enter a valid API key
              </FormControl.ValidationMessage>
            )}
            <FormControl.HelpText>
              Your API key is stored securely and never exposed to the browser.
            </FormControl.HelpText>
          </FormControl>
        </Form>
      </Box>
    </>
  );
}

interface ContentTypeSectionProps {
  selectedContentTypes: { id: string; name: string }[];
  setSelectedContentTypes: (contentTypes: { id: string; name: string }[]) => void;
  cma: PlainClientAPI;
  sdk: ConfigAppSDK;
}

function ContentTypeSection({
  selectedContentTypes,
  setSelectedContentTypes,
  cma,
  sdk,
}: ContentTypeSectionProps) {
  const [availableContentTypes, setAvailableContentTypes] = useState<
    { id: string; name: string }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAllContentTypes = async (): Promise<ContentTypeProps[]> => {
    let allContentTypes: ContentTypeProps[] = [];
    let skip = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      const response = await cma.contentType.getMany({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        query: { skip, limit },
      });
      if (response.items) {
        allContentTypes = allContentTypes.concat(response.items as ContentTypeProps[]);
        hasMore = response.items.length === limit;
      } else {
        hasMore = false;
      }
      skip += limit;
    }

    return allContentTypes;
  };

  useEffect(() => {
    (async () => {
      const currentState = await sdk.app.getCurrentState();
      const currentContentTypesIds = Object.keys(currentState?.EditorInterface || {});

      const allContentTypes = await fetchAllContentTypes();

      const newAvailableContentTypes = allContentTypes
        .map((ct) => ({
          id: ct.sys.id,
          name: ct.name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setAvailableContentTypes(newAvailableContentTypes);

      if (currentContentTypesIds.length > 0) {
        const currentContentTypes = allContentTypes
          .filter((ct) => currentContentTypesIds.includes(ct.sys.id))
          .map((ct) => ({ id: ct.sys.id, name: ct.name }));
        setSelectedContentTypes(currentContentTypes);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setSelectedContentTypes(selectedContentTypes.filter((ct) => ct.id !== item.id));
  };

  const isAllSelected = selectedContentTypes.length === availableContentTypes.length;

  return (
    <>
      <Heading as="h2" marginBottom="spacing2Xs">
        Add Broadcast to your content types
      </Heading>
      <Paragraph marginBottom="spacingM">
        Select which content types should have the Broadcast sidebar available. You can also
        configure this later from the content type settings.
      </Paragraph>
      <Stack flexDirection="column" alignItems="start">
        <Autocomplete<{ id: string; name: string }>
          items={filteredContentTypes}
          onInputValueChange={setSearchQuery}
          onSelectItem={handleSelectItem}
          placeholder={isAllSelected ? 'All content types selected' : 'Search content types...'}
          isDisabled={isAllSelected}
          itemToString={(item) => item.name}
          renderItem={(item) => <Text fontWeight="fontWeightDemiBold">{item.name}</Text>}
          textOnAfterSelect="clear"
          closeAfterSelect={false}
          listWidth="full"
        />

        {selectedContentTypes.length > 0 && (
          <Box width="full" overflow="auto">
            <Paragraph marginBottom="spacingXs">Selected content types:</Paragraph>
            <Flex flexDirection="row" gap="spacing2Xs" flexWrap="wrap">
              {selectedContentTypes.map((contentType) => (
                <Pill
                  key={contentType.id}
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

export default ConfigScreen;
