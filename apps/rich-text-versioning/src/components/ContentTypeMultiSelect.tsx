import React, { useEffect, useState } from 'react';
import { Box, Stack, Pill } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { ContentType, getRichTextFields, RichTextField } from '../utils';
import { ContentTypeProps, PlainClientAPI } from 'contentful-management';
import { ConfigAppSDK, CMAClient } from '@contentful/app-sdk';

interface RichTextFieldWithContext {
  id: string;
  name: string;
  contentTypeId: string;
  contentTypeName: string;
  displayName: string; // "Content type > Field name"
}

interface ContentTypeMultiSelectProps {
  selectedRichTextFields: RichTextFieldWithContext[];
  setSelectedRichTextFields: (fields: RichTextFieldWithContext[]) => void;
  sdk: ConfigAppSDK;
  cma: PlainClientAPI | CMAClient;
  filterContentTypes?: (contentType: ContentTypeProps) => boolean;
}

const ContentTypeMultiSelect: React.FC<ContentTypeMultiSelectProps> = ({
  selectedRichTextFields,
  setSelectedRichTextFields,
  sdk,
  cma,
  filterContentTypes = () => true,
}) => {
  const [availableRichTextFields, setAvailableRichTextFields] = useState<
    RichTextFieldWithContext[]
  >([]);

  const getPlaceholderText = () => {
    if (selectedRichTextFields.length === 0) return 'Select one or more rich text fields';
    if (selectedRichTextFields.length === 1) return selectedRichTextFields[0].displayName;
    return `${selectedRichTextFields[0].displayName} and ${selectedRichTextFields.length - 1} more`;
  };

  const [filteredItems, setFilteredItems] = React.useState<RichTextFieldWithContext[]>([]);

  const handleSearchValueChange = (event: { target: { value: any } }) => {
    const value = event.target.value;
    const newFilteredItems = availableRichTextFields.filter((field) =>
      field.displayName.toLowerCase().includes(value.toLowerCase())
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

  useEffect(() => {
    (async () => {
      const currentState = await sdk.app.getCurrentState();
      const currentEditorInterface = currentState?.EditorInterface || {};

      const allContentTypes = await fetchAllContentTypes();

      // Extract all rich text fields from all content types
      const allRichTextFields: RichTextFieldWithContext[] = [];

      allContentTypes
        .filter((ct) => filterContentTypes(ct))
        .forEach((contentType) => {
          const richTextFields = getRichTextFields(contentType);
          richTextFields.forEach((field) => {
            allRichTextFields.push({
              id: `${contentType.sys.id}.${field.id}`, // Unique identifier combining content type and field
              name: field.name,
              contentTypeId: contentType.sys.id,
              contentTypeName: contentType.name,
              displayName: `${contentType.name} > ${field.name}`,
            });
          });
        });

      // Sort by display name for consistent ordering
      const sortedFields = allRichTextFields.sort((a, b) =>
        a.displayName.localeCompare(b.displayName)
      );

      setAvailableRichTextFields(sortedFields);
      setFilteredItems(sortedFields);

      // Restore selected fields from saved state
      const currentFields: RichTextFieldWithContext[] = [];

      Object.entries(currentEditorInterface).forEach(([contentTypeId, config]) => {
        const fieldIds = config.controls?.map((control) => control.fieldId) || [];

        // Find fields that match both content type and field IDs
        const matchingFields = sortedFields.filter(
          (field) => field.contentTypeId === contentTypeId && fieldIds.includes(field.name)
        );

        currentFields.push(...matchingFields);
      });

      if (currentFields.length > 0) {
        setSelectedRichTextFields(currentFields);
      }
    })();
  }, []);

  return (
    <>
      <Stack marginTop="spacingXs" flexDirection="column" alignItems="start">
        <Multiselect
          searchProps={{
            searchPlaceholder: 'Search rich text fields',
            onSearchValueChange: handleSearchValueChange,
          }}
          placeholder={getPlaceholderText()}>
          {filteredItems.map((item) => (
            <Multiselect.Option
              key={item.id}
              value={item.id}
              itemId={item.id}
              isChecked={selectedRichTextFields.some((field) => field.id === item.id)}
              onSelectItem={(e) => {
                const checked = e.target.checked;
                if (checked) {
                  setSelectedRichTextFields([...selectedRichTextFields, item]);
                } else {
                  setSelectedRichTextFields(
                    selectedRichTextFields.filter((field) => field.id !== item.id)
                  );
                }
              }}>
              {item.displayName}
            </Multiselect.Option>
          ))}
        </Multiselect>

        {selectedRichTextFields.length > 0 && (
          <Box width="full" overflow="auto">
            <Stack flexDirection="row" spacing="spacing2Xs" flexWrap="wrap">
              {selectedRichTextFields.map((field, index) => (
                <Pill
                  key={index}
                  testId={`pill-${field.displayName.replace(/\s+/g, '-').replace(/>/g, '->')}`}
                  label={field.displayName}
                  isDraggable={false}
                  onClose={() =>
                    setSelectedRichTextFields(
                      selectedRichTextFields.filter((f) => f.id !== field.id)
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
