import React, { useCallback, useEffect, useState } from 'react';
import { Box, Stack, Pill } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { CONFIG_CONTENT_TYPE_ID, ContentType } from '../utils';
import { ContentTypeProps, PlainClientAPI } from 'contentful-management';
import { ConfigAppSDK } from '@contentful/app-sdk';

interface ContentTypeMultiSelectProps {
  selectedContentTypes: ContentType[];
  setSelectedContentTypes: (contentTypes: ContentType[]) => void;
  sdk: ConfigAppSDK;
  cma: PlainClientAPI;
}

const ContentTypeMultiSelect: React.FC<ContentTypeMultiSelectProps> = ({
  selectedContentTypes,
  setSelectedContentTypes,
  sdk,
  cma,
}) => {
  const [availableContentTypes, setAvailableContentTypes] = useState<ContentType[]>([]);
  const getPlaceholderText = useCallback(() => {
    if (selectedContentTypes.length === 0) return 'Select one or more';
    if (selectedContentTypes.length === 1) return selectedContentTypes[0].name;
    return `${selectedContentTypes[0].name} and ${selectedContentTypes.length - 1} more`;
  }, [selectedContentTypes]);
  const [filteredItems, setFilteredItems] = React.useState<ContentType[]>([]);

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
      const response = await cma.contentType.getMany({
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
      const currentState = await sdk.app.getCurrentState();
      const currentContentTypesIds = Object.keys(currentState?.EditorInterface || {});
      const excludedContentTypesIds = [CONFIG_CONTENT_TYPE_ID];

      const allContentTypes = await fetchAllContentTypes();

      const newAvailableContentTypes = allContentTypes
        .filter((ct) => !excludedContentTypesIds.includes(ct.sys.id))
        .map((ct) => ({
          id: ct.sys.id,
          name: ct.name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setAvailableContentTypes(newAvailableContentTypes);
      setFilteredItems(newAvailableContentTypes);

      // If we have current content types, set them as selected
      if (currentContentTypesIds.length > 0) {
        const currentContentTypes = allContentTypes
          .filter((ct) => currentContentTypesIds.includes(ct.sys.id))
          .map((ct) => ({ id: ct.sys.id, name: ct.name }));
        setSelectedContentTypes(currentContentTypes);
      }
    })();
  }, []);

  return (
    <>
      <Stack marginTop="spacingXs" flexDirection="column" alignItems="start">
        <Multiselect
          searchProps={{
            searchPlaceholder: 'Search content types',
            onSearchValueChange: handleSearchValueChange,
          }}
          placeholder={getPlaceholderText()}>
          {filteredItems.map((item) => (
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
                  setSelectedContentTypes(selectedContentTypes.filter((ct) => ct.id !== item.id));
                }
              }}>
              {item.name}
            </Multiselect.Option>
          ))}
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
    </>
  );
};

export default ContentTypeMultiSelect;
