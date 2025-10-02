import React, { useEffect, useState } from 'react';
import { Box, Stack, Pill, Skeleton, Paragraph } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { ContentType } from '../types';
import { ContentTypeProps, PlainClientAPI } from 'contentful-management';
import { ConfigAppSDK, CMAClient } from '@contentful/app-sdk';

type ContentTypeMultiSelectProps = {
  selectedContentTypes: ContentType[];
  setSelectedContentTypes: (contentTypes: ContentType[]) => void;
  sdk: ConfigAppSDK;
  cma: PlainClientAPI | CMAClient;
  excludedContentTypesIds?: string[];
};

const ContentTypeMultiSelect: React.FC<ContentTypeMultiSelectProps> = ({
  selectedContentTypes,
  setSelectedContentTypes,
  sdk,
  cma,
  excludedContentTypesIds = [],
}) => {
  const [availableContentTypes, setAvailableContentTypes] = useState<ContentType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getPlaceholderText = () => {
    if (selectedContentTypes.length === 0) return 'Select one or more';
    if (selectedContentTypes.length === 1) return selectedContentTypes[0].name;
    return `${selectedContentTypes[0].name} and ${selectedContentTypes.length - 1} more`;
  };
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
        allContentTypes = allContentTypes.concat(response.items);
        areMoreContentTypes = response.items.length === limit;
      } else {
        areMoreContentTypes = false;
      }
      skip += limit;
    }

    return allContentTypes;
  };

  const checkContentTypeHasLivePreview = async (contentTypeId: string): Promise<boolean> => {
    try {
      // Fetch a few entries of this content type to check if any have a slug field
      const entries = await cma.entry.getMany({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        query: {
          content_type: contentTypeId,
          limit: 10, // Check up to 10 entries to determine if this content type has live preview
        },
      });

      // Check if any entry has a slug field
      return entries.items.some((entry) => entry.fields.slug);
    } catch (error) {
      console.error(`Error checking live preview for content type ${contentTypeId}:`, error);
      // If we can't determine, assume it doesn't have live preview to be safe
      return false;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const currentState = await sdk.app.getCurrentState();
        const currentContentTypesIds = Object.keys(currentState?.EditorInterface || {});

        const allContentTypes = await fetchAllContentTypes();

        // Filter out content types that have live preview (entries with slug field)
        const contentTypesWithoutLivePreview: ContentTypeProps[] = [];

        for (const contentType of allContentTypes) {
          if (excludedContentTypesIds.includes(contentType.sys.id)) {
            continue; // Skip explicitly excluded content types
          }

          const hasLivePreview = await checkContentTypeHasLivePreview(contentType.sys.id);
          if (!hasLivePreview) {
            contentTypesWithoutLivePreview.push(contentType);
          }
        }

        const newAvailableContentTypes = contentTypesWithoutLivePreview
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
      } catch (err) {
        console.error('Error loading content types:', err);
        setError('Failed to load content types. Please try again.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <Skeleton.Container>
        <Skeleton.BodyText numberOfLines={2} />
      </Skeleton.Container>
    );
  }

  if (error) {
    return (
      <Box>
        <Paragraph color="negative">{error}</Paragraph>
      </Box>
    );
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
