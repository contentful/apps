import { Box, Flex, Pill, Stack } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { useEffect, useState } from 'react';
import type { ContentTypeOption } from '../types';

interface ContentTypeMultiSelectProps {
  availableContentTypes: ContentTypeOption[];
  selectedContentTypes: ContentTypeOption[];
  onSelectionChange: (contentTypes: ContentTypeOption[]) => void;
  isDisabled?: boolean;
}

const ContentTypeMultiSelect = ({
  availableContentTypes,
  selectedContentTypes,
  onSelectionChange,
  isDisabled = false,
}: ContentTypeMultiSelectProps) => {
  const [filteredContentTypes, setFilteredContentTypes] = useState(availableContentTypes);

  useEffect(() => {
    setFilteredContentTypes(availableContentTypes);
  }, [availableContentTypes]);

  const getPlaceholderText = () => {
    if (selectedContentTypes.length === 0) return 'Select one or more';
    if (selectedContentTypes.length === 1) return selectedContentTypes[0].name;
    return `${selectedContentTypes[0].name} and ${selectedContentTypes.length - 1} more`;
  };

  return (
    <Stack flexDirection="column" alignItems="flex-start">
      <Multiselect
        currentSelection={selectedContentTypes.map((contentType) => contentType.name)}
        placeholder={getPlaceholderText()}
        searchProps={{
          searchPlaceholder: 'Search content types',
          onSearchValueChange: (event) => {
            const value = event.target.value.toLowerCase();
            setFilteredContentTypes(
              availableContentTypes.filter((contentType) =>
                contentType.name.toLowerCase().includes(value)
              )
            );
          },
        }}
        popoverProps={{ isFullWidth: true }}
        noMatchesMessage="No content types match your search."
        triggerButtonProps={{ isDisabled }}>
        {filteredContentTypes.map((contentType) => (
          <Multiselect.Option
            key={contentType.id}
            itemId={contentType.id}
            value={contentType.id}
            label={contentType.name}
            isChecked={selectedContentTypes.some((selected) => selected.id === contentType.id)}
            onSelectItem={(event) => {
              const checked = event.target.checked;
              if (checked) {
                onSelectionChange([...selectedContentTypes, contentType]);
                return;
              }

              onSelectionChange(
                selectedContentTypes.filter((selected) => selected.id !== contentType.id)
              );
            }}
          />
        ))}
      </Multiselect>
      {selectedContentTypes.length > 0 && (
        <Box marginTop="spacingS">
          <Flex flexWrap="wrap" gap="spacingS">
            {selectedContentTypes.map((contentType) => (
              <Pill
                key={contentType.id}
                label={contentType.name}
                onClose={() =>
                  onSelectionChange(
                    selectedContentTypes.filter((selected) => selected.id !== contentType.id)
                  )
                }
                closeButtonAriaLabel="Remove content type"
              />
            ))}
          </Flex>
        </Box>
      )}
    </Stack>
  );
};

export default ContentTypeMultiSelect;
