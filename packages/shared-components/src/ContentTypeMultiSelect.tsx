import React, { useMemo } from 'react';
import { Box, Stack, Pill } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';

export interface ContentType {
  id: string;
  name: string;
}

interface ContentTypeMultiSelectProps {
  availableContentTypesIds?: string[];
  selectedContentTypes: ContentType[];
  setSelectedContentTypes: (contentTypes: ContentType[]) => void;
  maxSelected?: number;
  disablePills?: boolean;
}

const ContentTypeMultiSelect: React.FC<ContentTypeMultiSelectProps> = ({
  availableContentTypesIds,
  selectedContentTypes,
  setSelectedContentTypes,
  maxSelected,
  disablePills = false,
}) => {
  // Mock content types - TODO: Replace with useContentTypes hook
  const availableContentTypes: ContentType[] = [
    { id: 'article', name: 'Article' },
    { id: 'blogPost', name: 'Blog Post' },
    { id: 'product', name: 'Product' },
    { id: 'category', name: 'Category' },
    { id: 'author', name: 'Author' },
    { id: 'page', name: 'Page' },
  ];
  const [filteredContentTypes, setFilteredContentTypes] =
    React.useState<ContentType[]>(availableContentTypes);

  const getPlaceholderText = () => {
    if (selectedContentTypes.length === 0) return 'Select one or more';
    if (selectedContentTypes.length === 1) return selectedContentTypes[0].name;
    return `${selectedContentTypes[0].name} and ${selectedContentTypes.length - 1} more`;
  };

  const handleSearchValueChange = (event: { target: { value: any } }) => {
    const value = event.target.value;
    const newFilteredContentTypes = availableContentTypes.filter((contentType) =>
      contentType.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredContentTypes(newFilteredContentTypes);
  };

  const isAtMax = useMemo(
    () => !!maxSelected && selectedContentTypes.length >= maxSelected,
    [selectedContentTypes]
  );

  return (
    <Stack marginTop="spacingXs" flexDirection="column" alignItems="start">
      <Multiselect
        searchProps={{
          searchPlaceholder: 'Search content types',
          onSearchValueChange: handleSearchValueChange,
        }}
        placeholder={getPlaceholderText()}>
        {filteredContentTypes.map((item) => {
          const isSelected = selectedContentTypes.some((ct) => ct.id === item.id);
          const isDisabled = !isSelected && isAtMax;

          return (
            <Multiselect.Option
              key={item.id}
              value={item.id}
              itemId={item.id}
              isChecked={isSelected}
              isDisabled={isDisabled}
              onSelectItem={(e) => {
                const checked = e.target.checked;
                if (checked) {
                  setSelectedContentTypes([...selectedContentTypes, item]);
                } else {
                  setSelectedContentTypes(selectedContentTypes.filter((ct) => ct.id !== item.id));
                }
              }}>
              {item.name}
            </Multiselect.Option>
          );
        })}
      </Multiselect>

      {!disablePills && selectedContentTypes.length > 0 && (
        <Box width="full" overflow="auto">
          <Stack flexDirection="row" spacing="spacing2Xs" flexWrap="wrap">
            {selectedContentTypes.map((contentType, index) => (
              <Pill
                key={index}
                label={contentType.name}
                isDraggable={false}
                onClose={() =>
                  setSelectedContentTypes(
                    selectedContentTypes.filter((ct) => ct.id !== contentType.id)
                  )
                }
              />
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
};

export default ContentTypeMultiSelect;
