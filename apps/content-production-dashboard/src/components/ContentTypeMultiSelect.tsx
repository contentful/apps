import React, { useEffect, useState } from 'react';
import { Box, Stack, Pill } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { ContentTypeProps } from 'contentful-management';
import { ConfigAppSDK } from '@contentful/app-sdk';

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
}

const ContentTypeMultiSelect: React.FC<ContentTypeMultiSelectProps> = ({
  selectedContentTypes,
  setSelectedContentTypes,
  sdk,
  initialSelectedIds,
  maxSelected,
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
      setFilteredItems(newAvailableContentTypes);

      // Initialize selected content types from initialSelectedIds if provided
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
          const isAtMax = !!maxSelected && selectedContentTypes.length >= maxSelected;
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
                  if (!maxSelected || selectedContentTypes.length < maxSelected) {
                    setSelectedContentTypes([...selectedContentTypes, item]);
                  }
                } else {
                  setSelectedContentTypes(selectedContentTypes.filter((ct) => ct.id !== item.id));
                }
              }}>
              {item.name}
            </Multiselect.Option>
          );
        })}
      </Multiselect>

      {selectedContentTypes.length > 0 && (
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
