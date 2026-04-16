import React, { useState, useEffect } from 'react';
import { Box, Flex, Stack, Pill } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';

export interface ContentTypeOption {
  id: string;
  name: string;
}

export interface ContentTypeMultiSelectProps {
  availableContentTypes: ContentTypeOption[];
  selectedContentTypes: ContentTypeOption[];
  onSelectionChange: (contentTypes: ContentTypeOption[]) => void;
  isDisabled?: boolean;
}

const ContentTypeMultiSelect: React.FC<ContentTypeMultiSelectProps> = ({
  availableContentTypes,
  selectedContentTypes,
  onSelectionChange,
  isDisabled = false,
}) => {
  const [filteredContentTypes, setFilteredContentTypes] = useState(availableContentTypes);

  const getPlaceholderText = () => {
    if (selectedContentTypes.length === 0) return 'Select one or more';
    if (selectedContentTypes.length === 1) return selectedContentTypes[0].name;
    return `${selectedContentTypes[0].name} and ${selectedContentTypes.length - 1} more`;
  };

  const handleSearchValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const newFilteredContentTypes = availableContentTypes.filter((contentType) =>
      contentType.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredContentTypes(newFilteredContentTypes);
  };

  const handleContentTypeToggle = (contentType: ContentTypeOption, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedContentTypes, contentType]);
    } else {
      onSelectionChange(selectedContentTypes.filter((ct) => ct.id !== contentType.id));
    }
  };

  const handleContentTypeRemove = (contentTypeId: string) => {
    onSelectionChange(selectedContentTypes.filter((ct) => ct.id !== contentTypeId));
  };

  const handleSelectItem =
    (contentType: ContentTypeOption) => (event: React.ChangeEvent<HTMLInputElement>) => {
      handleContentTypeToggle(contentType, event.target.checked);
    };

  useEffect(() => {
    setFilteredContentTypes(availableContentTypes);
  }, [availableContentTypes]);

  return (
    <Stack flexDirection="column" alignItems="flex-start">
      <Multiselect
        currentSelection={selectedContentTypes.map((ct) => ct.name)}
        placeholder={getPlaceholderText()}
        searchProps={{
          searchPlaceholder: 'Search content types',
          onSearchValueChange: handleSearchValueChange,
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
            isChecked={selectedContentTypes.some((ct) => ct.id === contentType.id)}
            onSelectItem={handleSelectItem(contentType)}
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
                onClose={() => handleContentTypeRemove(contentType.id)}
                closeButtonAriaLabel="Close"
                data-test-id={`pill-${contentType.id}`}
              />
            ))}
          </Flex>
        </Box>
      )}
    </Stack>
  );
};

export default ContentTypeMultiSelect;
