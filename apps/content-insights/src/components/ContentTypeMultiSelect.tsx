import React, { useEffect, useState } from 'react';
import { Box, Stack, Pill } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { fetchContentTypes } from '../utils/fetchContentTypes';

export interface ContentType {
  id: string;
  name: string;
}

interface ContentTypeMultiSelectProps {
  selectedContentTypes: ContentType[];
  setSelectedContentTypes: (contentTypes: ContentType[]) => void;
  sdk: ConfigAppSDK;
  initialSelectedIds?: string[];
  maxSelected?: number;
  disablePills?: boolean;
}

const ContentTypeMultiSelect: React.FC<ContentTypeMultiSelectProps> = ({
  selectedContentTypes,
  setSelectedContentTypes,
  sdk,
  initialSelectedIds,
  maxSelected,
  disablePills = false,
}) => {
  const [availableContentTypes, setAvailableContentTypes] = useState<ContentType[]>([]);
  const [filteredItems, setFilteredItems] = React.useState<ContentType[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const getPlaceholderText = () => {
    if (selectedContentTypes.length === 0) return 'Select one or more';
    if (selectedContentTypes.length === 1) return selectedContentTypes[0].name;
    return `${selectedContentTypes[0].name} and ${selectedContentTypes.length - 1} more`;
  };

  const handleSearchValueChange = (event: { target: { value: any } }) => {
    const value = event.target.value;
    const newFilteredItems = availableContentTypes.filter((contentType) =>
      contentType.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredItems(newFilteredItems);
  };

  useEffect(() => {
    (async () => {
      const { contentTypes } = await fetchContentTypes(sdk);

      const newAvailableContentTypes = Array.from(contentTypes.values())
        .map((ct) => ({
          id: ct.sys.id,
          name: ct.name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setAvailableContentTypes(newAvailableContentTypes);
      setFilteredItems(newAvailableContentTypes);

      if (initialSelectedIds && initialSelectedIds.length > 0 && !isInitialized) {
        let initialSelected = newAvailableContentTypes.filter((ct) =>
          initialSelectedIds.includes(ct.id)
        );

        if (maxSelected && initialSelected.length > maxSelected) {
          initialSelected = initialSelected.slice(0, maxSelected);
        }

        if (initialSelected.length > 0) {
          setSelectedContentTypes(initialSelected);
          setIsInitialized(true);
        }
      }
    })();
  }, [initialSelectedIds]);

  const isAtMax = !!maxSelected && selectedContentTypes.length >= maxSelected;

  return (
    <Stack marginTop="spacingXs" flexDirection="column" alignItems="start">
      <Multiselect
        searchProps={{
          searchPlaceholder: 'Search content types',
          onSearchValueChange: handleSearchValueChange,
        }}
        placeholder={getPlaceholderText()}>
        {filteredItems.map((item) => {
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
