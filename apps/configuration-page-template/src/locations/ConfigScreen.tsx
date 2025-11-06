import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Heading,
  Form,
  Paragraph,
  Flex,
  FormControl,
  Subheading,
  TextInput,
  TextLink,
  Stack,
  Pill,
  Text,
} from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { css } from 'emotion';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { ContentTypeProps } from 'contentful-management';

export interface AppInstallationParameters {}

interface ContentType {
  id: string;
  name: string;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const sdk = useSDK<ConfigAppSDK>();

  const [apiKey, setApiKey] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentType[]>([]);
  const [availableContentTypes, setAvailableContentTypes] = useState<ContentType[]>([]);
  const [filteredContentTypes, setFilteredContentTypes] = useState<ContentType[]>([]);

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

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

      // Fetch content types
      const allContentTypes = await fetchAllContentTypes();
      const contentTypes = allContentTypes
        .map((ct) => ({
          id: ct.sys.id,
          name: ct.name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setAvailableContentTypes(contentTypes);
      setFilteredContentTypes(contentTypes);

      sdk.app.setReady();
    })();
  }, [sdk]);

  const fetchAllContentTypes = async (): Promise<ContentTypeProps[]> => {
    let allContentTypes: ContentTypeProps[] = [];
    let skip = 0;
    const limit = 1000;
    let areMoreContentTypes = true;

    while (areMoreContentTypes) {
      const response = await sdk.cma.contentType.getMany({
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

  const handleSearchValueChange = (event: { target: { value: string } }) => {
    const value = event.target.value;
    const newFilteredItems = availableContentTypes.filter((contentType) =>
      contentType.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredContentTypes(newFilteredItems);
  };

  const getPlaceholderText = () => {
    if (selectedContentTypes.length === 0) return 'Select one or more';
    if (selectedContentTypes.length === 1) return selectedContentTypes[0].name;
    return `${selectedContentTypes[0].name} and ${selectedContentTypes.length - 1} more`;
  };

  return (
    <Flex flexDirection="column" gap="spacing3Xl" fullWidth>
      {/* Page Header */}
      <Flex flexDirection="column" gap="spacingS">
        <Heading as="h1" marginBottom="none">
          Set up my marketplace app
        </Heading>
        <Paragraph marginBottom="none">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
          ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </Paragraph>
      </Flex>

      {/* Configure Access Section */}
      <Flex flexDirection="column" gap="spacingL">
        <Flex flexDirection="column" gap="spacingS">
          <Subheading marginBottom="none">Configure access</Subheading>
          <Paragraph marginBottom="none">Section subtitle with basic instructions</Paragraph>
        </Flex>

        <Form>
          <FormControl isRequired marginBottom="spacingL">
            <FormControl.Label>Your key</FormControl.Label>
            <TextInput
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-...dsvb"
            />
            <FormControl.HelpText>
              Help text with{' '}
              <TextLink href="#" icon={<ExternalLinkIcon />} alignIcon="end">
                link out
              </TextLink>
            </FormControl.HelpText>
          </FormControl>

          <FormControl isRequired>
            <FormControl.Label>Your website URL</FormControl.Label>
            <TextInput
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="http://www..."
            />
            <FormControl.HelpText>Help text</FormControl.HelpText>
          </FormControl>
        </Form>
      </Flex>

      {/* Assign Content Types Section */}
      <Flex flexDirection="column" gap="spacingL">
        <Flex flexDirection="column" gap="spacingS">
          <Subheading marginBottom="none">Assign content types</Subheading>
          <Paragraph marginBottom="none">Section subtitle with basic instructions</Paragraph>
        </Flex>

        <Flex flexDirection="column" gap="spacingM">
          <FormControl>
            <FormControl.Label>Content types</FormControl.Label>
            <Stack flexDirection="column" alignItems="start" spacing="spacingM">
              <Multiselect
                searchProps={{
                  searchPlaceholder: 'Search content types',
                  onSearchValueChange: handleSearchValueChange,
                }}
                placeholder={getPlaceholderText()}>
                {filteredContentTypes.map((item) => (
                  <Multiselect.Option
                    key={item.id}
                    value={item.id}
                    itemId={item.id}
                    isChecked={selectedContentTypes.some((ct) => ct.id === item.id)}
                    onSelectItem={(e) => {
                      const checked = e.target.checked;
                      if (checked) {
                        setSelectedContentTypes([...selectedContentTypes, item]);
                      } else {
                        setSelectedContentTypes(
                          selectedContentTypes.filter((ct) => ct.id !== item.id)
                        );
                      }
                    }}>
                    {item.name}
                  </Multiselect.Option>
                ))}
              </Multiselect>

              {selectedContentTypes.length > 0 && (
                <Stack flexDirection="row" spacing="spacingS" flexWrap="wrap" fullWidth>
                  {selectedContentTypes.map((contentType) => (
                    <Pill
                      key={contentType.id}
                      label={contentType.name}
                      onClose={() =>
                        setSelectedContentTypes(
                          selectedContentTypes.filter((ct) => ct.id !== contentType.id)
                        )
                      }
                    />
                  ))}
                </Stack>
              )}
            </Stack>
          </FormControl>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ConfigScreen;
