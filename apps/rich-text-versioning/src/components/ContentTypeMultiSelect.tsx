import React, { useState } from 'react';
import { Box, Stack, Pill, Paragraph, Flex } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { RichTextFieldWithContext } from '../utils';

interface ContentTypeMultiSelectProps {
  availableFields: RichTextFieldWithContext[];
  selectedFields: RichTextFieldWithContext[];
  onSelectionChange: (fields: RichTextFieldWithContext[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
}

const ContentTypeMultiSelect: React.FC<ContentTypeMultiSelectProps> = ({
  availableFields,
  selectedFields,
  onSelectionChange,
  placeholder = 'Select one or more',
  searchPlaceholder = 'Search content types',
  isDisabled = false,
  isLoading = false,
}) => {
  const [filteredFields, setFilteredFields] = useState<RichTextFieldWithContext[]>(availableFields);

  const getPlaceholderText = () => {
    if (selectedFields.length === 0) return placeholder;
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

  const handleFieldToggle = (field: RichTextFieldWithContext, checked: boolean) => {
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
          searchPlaceholder,
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

export default ContentTypeMultiSelect;
