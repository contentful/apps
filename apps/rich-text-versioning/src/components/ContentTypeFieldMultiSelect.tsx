import React, { useState } from 'react';
import { Box, Stack, Pill } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { RichTextFieldInfo as RichTextFieldInfo } from '../utils';

interface ContentTypeMultiSelectProps {
  availableFields: RichTextFieldInfo[];
  selectedFields: RichTextFieldInfo[];
  onSelectionChange: (fields: RichTextFieldInfo[]) => void;
  isDisabled?: boolean;
}

const ContentTypeFieldMultiSelect: React.FC<ContentTypeMultiSelectProps> = ({
  availableFields,
  selectedFields,
  onSelectionChange,
  isDisabled = false,
}) => {
  const [filteredFields, setFilteredFields] = useState<RichTextFieldInfo[]>(availableFields);

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

  const handleFieldToggle = (field: RichTextFieldInfo, checked: boolean) => {
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
        triggerButtonProps={{ isDisabled }}>
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
