import { useMemo, useState } from 'react';
import { Box, Stack, Pill } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { useContentTypes } from './hooks/useContentTypes';

export interface ContentType {
  id: string;
  name: string;
}

export interface ContentTypeMultiSelectProps {
  availableContentTypesIds?: string[];
  selectedContentTypesIds: string[];
  setSelectedContentTypesIds: (contentTypesIds: string[]) => void;
  maxSelected?: number;
  disablePills?: boolean;
}

export function ContentTypeMultiSelect({
  availableContentTypesIds,
  selectedContentTypesIds,
  setSelectedContentTypesIds,
  maxSelected,
  disablePills = false,
}: ContentTypeMultiSelectProps) {
  const availableContentTypes = useContentTypes(availableContentTypesIds);
  const [filteredContentTypes, setFilteredContentTypes] =
    useState<ContentType[]>(availableContentTypes);

  const getContentTypeName = (contentTypeId: string) => {
    const contentType = availableContentTypes.find((ct) => ct.id === contentTypeId);
    if (!contentType) return '';

    return contentType.name;
  };

  const getPlaceholderText = () => {
    const firstContentTypeName = getContentTypeName(selectedContentTypesIds[0]);

    if (selectedContentTypesIds.length === 0) return 'Select one or more';
    if (selectedContentTypesIds.length === 1) return firstContentTypeName;
    return `${firstContentTypeName} and ${selectedContentTypesIds.length - 1} more`;
  };

  const handleSearchValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const newFilteredContentTypes = availableContentTypes.filter((contentType) =>
      contentType.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredContentTypes(newFilteredContentTypes);
  };

  const isAtMax = useMemo(
    () => !!maxSelected && selectedContentTypesIds.length >= maxSelected,
    [selectedContentTypesIds, maxSelected]
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
          const isSelected = selectedContentTypesIds.includes(item.id);
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
                  setSelectedContentTypesIds([...selectedContentTypesIds, item.id]);
                } else {
                  setSelectedContentTypesIds(
                    selectedContentTypesIds.filter((ct) => ct !== item.id)
                  );
                }
              }}>
              {item.name}
            </Multiselect.Option>
          );
        })}
      </Multiselect>

      {!disablePills && selectedContentTypesIds.length > 0 && (
        <Box width="full" overflow="auto">
          <Stack flexDirection="row" spacing="spacing2Xs" flexWrap="wrap">
            {selectedContentTypesIds.map((contentTypeId, index) => (
              <Pill
                key={index}
                label={getContentTypeName(contentTypeId)}
                isDraggable={false}
                onClose={() =>
                  setSelectedContentTypesIds(
                    selectedContentTypesIds.filter((ct) => ct !== contentTypeId)
                  )
                }
              />
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
