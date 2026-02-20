import React, { useEffect, useState, useMemo } from 'react';
import { Box, Stack, Pill, Note } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { ContentType } from '../utils/types';
import { ContentTypeProps } from 'contentful-management';
import { CMAClient } from '@contentful/app-sdk';

const DEFAULT_EXCLUDED_IDS: string[] = [];

interface ContentTypeMultiSelectProps {
  selectedContentTypes: ContentType[];
  setSelectedContentTypes: (contentTypes: ContentType[]) => void;
  cma: CMAClient;
  excludedContentTypesIds?: string[];
}

const ContentTypeMultiSelect: React.FC<ContentTypeMultiSelectProps> = ({
  selectedContentTypes,
  setSelectedContentTypes,
  cma,
  excludedContentTypesIds = DEFAULT_EXCLUDED_IDS,
}) => {
  const [availableContentTypes, setAvailableContentTypes] = useState<ContentType[]>([]);
  const [filteredItems, setFilteredItems] = useState<ContentType[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const idPrefix = useMemo(() => `multiselect-${crypto.randomUUID()}-`, []);

  const getPlaceholderText = () => {
    if (selectedContentTypes.length === 0) return 'Select one or more';
    if (selectedContentTypes.length === 1) return selectedContentTypes[0].name;
    return `${selectedContentTypes[0].name} and ${selectedContentTypes.length - 1} more`;
  };

  const handleSearchValueChange = (event: { target: { value: string } }) => {
    const value = event.target.value;
    const newFilteredItems = availableContentTypes.filter((contentType) =>
      contentType.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredItems(newFilteredItems);
  };

  const fetchAllContentTypes = async (): Promise<ContentTypeProps[]> => {
    const allContentTypes: ContentTypeProps[] = [];
    let skip = 0;
    const limit = 1000;
    let fetched: number;

    do {
      const response = await cma.contentType.getMany({
        query: { skip, limit },
      });
      const items = response.items as ContentTypeProps[];
      allContentTypes.push(...items);
      fetched = items.length;
      skip += limit;
    } while (fetched === limit);

    return allContentTypes;
  };

  useEffect(() => {
    (async () => {
      try {
        setFetchError(null);
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
      } catch {
        setFetchError('Failed to load content types. Please try again later.');
      }
    })();
  }, [cma, excludedContentTypesIds]);

  if (fetchError) {
    console.error(fetchError);
    return;
  }

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
              key={`${idPrefix}${item.id}`}
              value={item.id}
              itemId={`${idPrefix}${item.id}`}
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
                  testId={`pill-${contentType.name}`}
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
