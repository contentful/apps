import { useMemo, useState } from 'react';
import { Autocomplete, Box, Flex, Pill, Text } from '@contentful/f36-components';

interface ContentTypeOption {
  id: string;
  name: string;
}

interface ContentTypePickerProps {
  contentTypes: ContentTypeOption[];
  selectedContentTypeIds: string[];
  onSelectionChange: (contentTypeIds: string[]) => void;
}

function ContentTypePicker({
  contentTypes,
  selectedContentTypeIds,
  onSelectionChange,
}: ContentTypePickerProps) {
  const [query, setQuery] = useState('');

  const selectedContentTypes = useMemo(() => {
    return selectedContentTypeIds
      .map((id) => contentTypes.find((contentType) => contentType.id === id))
      .filter(Boolean) as ContentTypeOption[];
  }, [contentTypes, selectedContentTypeIds]);

  const filteredContentTypes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return contentTypes.filter((contentType) => {
      const isSelected = selectedContentTypeIds.includes(contentType.id);
      const matchesQuery =
        normalizedQuery.length === 0 || contentType.name.toLowerCase().includes(normalizedQuery);

      return !isSelected && matchesQuery;
    });
  }, [contentTypes, query, selectedContentTypeIds]);

  const handleSelectItem = (contentType: ContentTypeOption | null) => {
    if (!contentType || selectedContentTypeIds.includes(contentType.id)) {
      return;
    }

    onSelectionChange([...selectedContentTypeIds, contentType.id]);
  };

  return (
    <Box>
      <Autocomplete<ContentTypeOption>
        items={filteredContentTypes}
        onInputValueChange={setQuery}
        onSelectItem={handleSelectItem}
        itemToString={(item) => item?.name ?? ''}
        renderItem={(item) => <Text fontWeight="fontWeightDemiBold">{item.name}</Text>}
        textOnAfterSelect="clear"
        closeAfterSelect={false}
        listWidth="full"
        placeholder={
          filteredContentTypes.length === 0 && selectedContentTypeIds.length === contentTypes.length
            ? 'All content types selected'
            : 'Search content types'
        }
        isDisabled={contentTypes.length > 0 && selectedContentTypeIds.length === contentTypes.length}
      />

      {selectedContentTypes.length > 0 && (
        <Box marginTop="spacingS">
          <Text fontSize="fontSizeS" fontColor="gray600">
            {selectedContentTypes.length} selected
          </Text>

          <Flex gap="spacingXs" flexWrap="wrap" marginTop="spacingS">
            {selectedContentTypes.map((contentType) => (
              <Pill
                key={contentType.id}
                label={contentType.name}
                onClose={() =>
                  onSelectionChange(selectedContentTypeIds.filter((id) => id !== contentType.id))
                }
              />
            ))}
          </Flex>
        </Box>
      )}
    </Box>
  );
}

export default ContentTypePicker;
