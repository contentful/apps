import React, { useEffect, useState } from 'react';
import { Box, Stack, Pill } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { ContentTypeProps } from 'contentful-management';
import { CMAClient, ConfigAppSDK } from '@contentful/app-sdk';
import { ContentType } from '../types';

interface ReferenceOnlyMultiSelectProps {
  selectedContentTypes: ContentType[];
  setSelectedContentTypes: (contentTypes: ContentType[]) => void;
  sdk: ConfigAppSDK;
  cma: CMAClient;
}

const ReferenceOnlyMultiSelect: React.FC<ReferenceOnlyMultiSelectProps> = ({
  selectedContentTypes,
  setSelectedContentTypes,
  sdk,
  cma,
}) => {
  const [availableContentTypes, setAvailableContentTypes] = useState<ContentType[]>([]);
  const [filteredItems, setFilteredItems] = React.useState<ContentType[]>([]);

  const getPlaceholderText = (): string => {
    if (selectedContentTypes.length === 0) return 'Select one or more';
    if (selectedContentTypes.length === 1) return selectedContentTypes[0]?.name || '';
    return `${selectedContentTypes[0]?.name || ''} and ${selectedContentTypes.length - 1} more`;
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
      const allContentTypes = await fetchAllContentTypes();

      const newAvailableContentTypes = allContentTypes
        .map((ct) => ({
          id: ct.sys.id,
          name: ct.name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setAvailableContentTypes(newAvailableContentTypes);
      setFilteredItems(newAvailableContentTypes);
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
          testId={'reference-only-components'}
          placeholder={getPlaceholderText()}>
          {filteredItems.map((item) => (
            <Multiselect.Option
              key={`reference-only-components-${item.id}`}
              value={item.id}
              itemId={`reference-only-components-${item.id}`}
              isChecked={selectedContentTypes.some((ct) => ct.id === item.id)}
              onSelectItem={(e: React.ChangeEvent<HTMLInputElement>) => {
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
            <Stack flexDirection="row" spacing="spacingXs" flexWrap="wrap">
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

export default ReferenceOnlyMultiSelect;
