import React, { useState, useEffect } from 'react';
import { Box, Stack, Pill } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useContentTypes } from '../hooks/useContentTypes';
import {
  ContentTypeInfo,
  processContentTypesToFields,
  loadSavedSelections,
  TargetState,
} from '../utils';

interface ContentTypeFieldMultiSelectProps {
  selectedFields: ContentTypeInfo[];
  onSelectionChange: (fields: ContentTypeInfo[]) => void;
  sdk: ConfigAppSDK;
  isDisabled?: boolean;
}

const ContentTypeFieldMultiSelect: React.FC<ContentTypeFieldMultiSelectProps> = ({
  selectedFields,
  onSelectionChange,
  sdk,
  isDisabled = false,
}) => {
  const { contentTypes, isLoading } = useContentTypes();
  const [availableFields, setAvailableFields] = useState<ContentTypeInfo[]>([]);
  const [filteredFields, setFilteredFields] = useState<ContentTypeInfo[]>([]);

  useEffect(() => {
    if (contentTypes.length > 0) {
      const available = processContentTypesToFields(contentTypes);
      setAvailableFields(available);
      setFilteredFields(available);

      // Load saved selections from saved state
      (async () => {
        try {
          const currentState = (await sdk.app.getCurrentState()) || { EditorInterface: {} };
          const savedSelections = loadSavedSelections(available, currentState as TargetState);
          if (savedSelections.length > 0) {
            onSelectionChange(savedSelections);
          }
        } catch (error) {
          console.error('Error loading saved selections:', error);
        }
      })();
    }
  }, [contentTypes, sdk, onSelectionChange]);

  const getPlaceholderText = () => {
    if (selectedFields.length === 0) return 'Select one or more';
    if (selectedFields.length === 1) return selectedFields[0].displayName;
    return `${selectedFields[0].displayName} and ${selectedFields.length - 1} more`;
  };

  const handleSearchValueChange = (event: { target: { value: string } }) => {
    const value = event.target.value;
    const newFilteredFields = availableFields.filter((field) =>
      field.displayName.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredFields(newFilteredFields);
  };

  const handleFieldToggle = (field: ContentTypeInfo, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedFields, field]);
    } else {
      onSelectionChange(selectedFields.filter((f) => f.fieldUniqueId !== field.fieldUniqueId));
    }
  };

  const handleFieldRemove = (fieldId: string) => {
    onSelectionChange(selectedFields.filter((f) => f.fieldUniqueId !== fieldId));
  };

  return (
    <Stack marginTop="spacingXs" flexDirection="column" alignItems="start">
      <Multiselect
        searchProps={{
          searchPlaceholder: 'Search content types',
          onSearchValueChange: handleSearchValueChange,
        }}
        placeholder={getPlaceholderText()}
        popoverProps={{ isFullWidth: true }}
        triggerButtonProps={{ isDisabled: isDisabled || isLoading }}>
        {filteredFields.map((field) => (
          <Multiselect.Option
            key={field.fieldUniqueId}
            value={field.fieldUniqueId}
            itemId={field.fieldUniqueId}
            isChecked={selectedFields.some((f) => f.fieldUniqueId === field.fieldUniqueId)}
            onSelectItem={(e) => handleFieldToggle(field, e.target.checked)}>
            {field.displayName}
          </Multiselect.Option>
        ))}
      </Multiselect>

      {selectedFields.length > 0 && (
        <Box width="full" overflow="auto">
          <Stack flexDirection="row" spacing="spacing2Xs" flexWrap="wrap">
            {selectedFields.map((field) => (
              <Pill
                key={field.fieldUniqueId}
                testId={`pill-${field.displayName.replace(/\s+/g, '-').replace(/>/g, '->')}`}
                label={field.displayName}
                isDraggable={false}
                onClose={() => handleFieldRemove(field.fieldUniqueId)}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
};

export default ContentTypeFieldMultiSelect;
