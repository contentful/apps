import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paragraph, Pill, Skeleton, Stack } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { CMAClient } from '@contentful/app-sdk';
import { ContentType, FieldOption } from '../types';

type PreviewFieldMultiSelectProps = {
  selectedContentTypes: ContentType[];
  selectedPreviewFieldIds: string[];
  setSelectedPreviewFieldIds: (fieldIds: string[]) => void;
  cma: CMAClient;
};

export const getDeduplicatedFields = (
  contentTypes: Array<{ fields: Array<{ id: string; type: string }> }>
): FieldOption[] => {
  const uniqueFields = new Map<string, FieldOption>();

  contentTypes.forEach((contentType) => {
    contentType.fields.forEach((field) => {
      if (field.type === 'Symbol' && !uniqueFields.has(field.id)) {
        uniqueFields.set(field.id, { id: field.id, name: field.id });
      }
    });
  });

  return [...uniqueFields.values()].sort((a, b) => a.name.localeCompare(b.name));
};

const PreviewFieldMultiSelect: React.FC<PreviewFieldMultiSelectProps> = ({
  selectedContentTypes,
  selectedPreviewFieldIds,
  setSelectedPreviewFieldIds,
  cma,
}) => {
  const [availableFields, setAvailableFields] = useState<FieldOption[]>([]);
  const [filteredItems, setFilteredItems] = useState<FieldOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedContentTypeIds = useMemo(
    () => selectedContentTypes.map((contentType) => contentType.id).sort(),
    [selectedContentTypes]
  );

  const getPlaceholderText = () => {
    if (selectedContentTypes.length === 0) return 'Select content types first';
    if (selectedPreviewFieldIds.length === 0) return 'Select one or more';
    if (selectedPreviewFieldIds.length === 1) return selectedPreviewFieldIds[0];
    return `${selectedPreviewFieldIds[0]} and ${selectedPreviewFieldIds.length - 1} more`;
  };

  const handleSearchValueChange = (event: { target: { value: string } }) => {
    const value = event.target.value.toLowerCase();
    setFilteredItems(availableFields.filter((field) => field.name.toLowerCase().includes(value)));
  };

  useEffect(() => {
    (async () => {
      if (selectedContentTypeIds.length === 0) {
        setAvailableFields([]);
        setFilteredItems([]);
        if (selectedPreviewFieldIds.length > 0) {
          setSelectedPreviewFieldIds([]);
        }
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const contentTypes = await Promise.all(
          selectedContentTypeIds.map((contentTypeId) => cma.contentType.get({ contentTypeId }))
        );

        const nextAvailableFields = getDeduplicatedFields(contentTypes);

        setAvailableFields(nextAvailableFields);
        setFilteredItems(nextAvailableFields);
      } catch (err) {
        console.error('Error loading preview fields:', err);
        setError('Failed to load fields for the selected content types. Please try again.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [cma, selectedContentTypeIds]);

  useEffect(() => {
    if (availableFields.length === 0) {
      return;
    }

    const nextAvailableFieldIds = new Set(availableFields.map((field) => field.id));
    const nextSelectedPreviewFieldIds = selectedPreviewFieldIds.filter((fieldId) =>
      nextAvailableFieldIds.has(fieldId)
    );

    if (nextSelectedPreviewFieldIds.length !== selectedPreviewFieldIds.length) {
      setSelectedPreviewFieldIds(nextSelectedPreviewFieldIds);
    }
  }, [availableFields, selectedPreviewFieldIds, setSelectedPreviewFieldIds]);

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
    <Stack marginTop="spacingXs" flexDirection="column" alignItems="start">
      <Multiselect
        searchProps={{
          searchPlaceholder: 'Search field IDs',
          onSearchValueChange: handleSearchValueChange,
        }}
        placeholder={getPlaceholderText()}>
        {filteredItems.map((item) => (
          <Multiselect.Option
            key={item.id}
            value={item.id}
            itemId={item.id}
            isChecked={selectedPreviewFieldIds.includes(item.id)}
            onSelectItem={(e) => {
              const checked = e.target.checked;
              if (checked) {
                setSelectedPreviewFieldIds([...selectedPreviewFieldIds, item.id]);
              } else {
                setSelectedPreviewFieldIds(
                  selectedPreviewFieldIds.filter((fieldId) => fieldId !== item.id)
                );
              }
            }}>
            {item.name}
          </Multiselect.Option>
        ))}
      </Multiselect>

      {selectedPreviewFieldIds.length > 0 && (
        <Box width="full" overflow="auto">
          <Stack flexDirection="row" spacing="spacing2Xs" flexWrap="wrap">
            {selectedPreviewFieldIds.map((fieldId) => (
              <Pill
                key={fieldId}
                testId={`pill-${fieldId}`}
                label={fieldId}
                isDraggable={false}
                onClose={() =>
                  setSelectedPreviewFieldIds(
                    selectedPreviewFieldIds.filter((selectedFieldId) => selectedFieldId !== fieldId)
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

export default PreviewFieldMultiSelect;
