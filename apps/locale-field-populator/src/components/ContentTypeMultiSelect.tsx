import React, { useState, useEffect } from 'react';
import { Box, Stack, Pill } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { ContentTypeProps } from 'contentful-management';

interface ContentTypeMultiSelectProps {
  availableContentTypes: ContentTypeProps[];
  selectedContentTypes: ContentTypeProps[];
  onSelectionChange: (contentTypes: ContentTypeProps[]) => void;
  isDisabled?: boolean;
}

const ContentTypeMultiSelect: React.FC<ContentTypeMultiSelectProps> = ({
  availableContentTypes,
  selectedContentTypes,
  onSelectionChange,
  isDisabled = false,
}) => {
  const [filteredContentTypes, setFilteredContentTypes] =
    useState<ContentTypeProps[]>(availableContentTypes);

  const getPlaceholderText = () => {
    if (selectedContentTypes.length === 0) return 'Select one or more';
    if (selectedContentTypes.length === 1) return selectedContentTypes[0].name;
    return `${selectedContentTypes[0].name} and ${selectedContentTypes.length - 1} more`;
  };

  const handleSearchValueChange = (event: { target: { value: string } }) => {
    const value = event.target.value;
    const newFilteredContentTypes = availableContentTypes.filter((contentType) =>
      contentType.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredContentTypes(newFilteredContentTypes);
  };

  const handleContentTypeToggle = (contentType: ContentTypeProps, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedContentTypes, contentType]);
    } else {
      onSelectionChange(selectedContentTypes.filter((ct) => ct.sys.id !== contentType.sys.id));
    }
  };

  const handleContentTypeRemove = (contentTypeId: string) => {
    onSelectionChange(selectedContentTypes.filter((ct) => ct.sys.id !== contentTypeId));
  };

  // Update filtered list when available content types change
  useEffect(() => {
    setFilteredContentTypes(availableContentTypes);
  }, [availableContentTypes]);

  return (
    <Stack marginTop="spacingXs" flexDirection="column" alignItems="start">
      <Multiselect
        searchProps={{
          searchPlaceholder: 'Search content types',
          onSearchValueChange: handleSearchValueChange,
        }}
        placeholder={getPlaceholderText()}
        popoverProps={{ isFullWidth: true }}
        triggerButtonProps={{ isDisabled }}>
        {filteredContentTypes.map((contentType) => (
          <Multiselect.Option
            key={contentType.sys.id}
            value={contentType.sys.id}
            itemId={contentType.sys.id}
            isChecked={selectedContentTypes.some((ct) => ct.sys.id === contentType.sys.id)}
            onSelectItem={(e) => handleContentTypeToggle(contentType, e.target.checked)}>
            {contentType.name}
          </Multiselect.Option>
        ))}
      </Multiselect>

      {selectedContentTypes.length > 0 && (
        <Box width="full" overflow="auto">
          <Stack flexDirection="row" spacing="spacing2Xs" flexWrap="wrap">
            {selectedContentTypes.map((contentType) => (
              <Pill
                key={contentType.sys.id}
                testId={`pill-${contentType.name.replace(/\s+/g, '-')}`}
                label={contentType.name}
                isDraggable={false}
                onClose={() => handleContentTypeRemove(contentType.sys.id)}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
};

export default ContentTypeMultiSelect;
