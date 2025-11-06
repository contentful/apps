import { useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Paragraph,
  Flex,
  Heading,
  Stack,
  Pill,
  Text,
  Autocomplete,
  Box,
} from '@contentful/f36-components';
import { ContentTypeProps } from 'contentful-management';

interface ContentTypesSectionProps {
  selectedContentTypes: { id: string; name: string }[];
  setSelectedContentTypes: (contentTypes: { id: string; name: string }[]) => void;
  sdk: ConfigAppSDK;
}

export default function AssignContentTypeDropdown(props: ContentTypesSectionProps) {
  const { selectedContentTypes, setSelectedContentTypes, sdk } = props;
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

  useEffect(() => {
    (async () => {
      const allContentTypes = await fetchAllContentTypes();

      const newAvailableContentTypes = allContentTypes
        .map((ct) => ({
          id: ct.sys.id,
          name: ct.name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setAvailableContentTypes(newAvailableContentTypes);
    })();
  }, []);

  const filteredContentTypes = availableContentTypes.filter(
    (contentType) =>
      !selectedContentTypes.some((selected) => selected.id === contentType.id) &&
      contentType.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectItem = (item: { id: string; name: string }) => {
    setSelectedContentTypes([...selectedContentTypes, item]);
    setSearchQuery(''); // Clear search query after selection
  };

  const handleUnselectItem = (item: { id: string; name: string }) => {
    setSelectedContentTypes(
      selectedContentTypes.filter((contentType) => contentType.id !== item.id)
    );
  };

  const isAllSelected = selectedContentTypes.length === availableContentTypes.length;

  return (
    <Box>
      <Heading marginBottom="none">Assign content types</Heading>
      <Paragraph marginBottom="spacingS">Section subtitle with basic instructions</Paragraph>
      <Stack flexDirection="column" alignItems="start" spacing="spacingS">
        <Autocomplete<{ id: string; name: string }>
          items={filteredContentTypes}
          inputValue={searchQuery}
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
            <Paragraph marginBottom="spacingXs">Selected content types:</Paragraph>
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
    </Box>
  );
}
