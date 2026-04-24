import { useEffect, useId, useMemo } from 'react';
import { Badge, Flex, FormControl, Text } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import type { EditModalFieldMapping, EditModalFieldOption } from '@types';
import { useMultiselectScrollReflow } from '@hooks/useMultiselectReflow';
import { isSelectableFieldType } from './utils';
import { optionRow } from './FieldSelectionDropdown.styles';

interface FieldSelectionDropdownProps {
  selectedText: string;
  isImageContent?: boolean;
  fieldOptions: EditModalFieldOption[];
  fieldMappings: EditModalFieldMapping[];
  selectedFieldIds: string[];
  /** Functional updates avoid stale `selectedFieldIds` when selecting multiple fields quickly. */
  onSelectedFieldIdsChange: (updater: (previous: string[]) => string[]) => void;
  onSelectableStateChange?: (state: {
    hasFieldOptions: boolean;
    hasSelectableOptions: boolean;
  }) => void;
}

export const FieldSelectionDropdown = ({
  selectedText,
  isImageContent = false,
  fieldOptions,
  fieldMappings,
  selectedFieldIds,
  onSelectedFieldIdsChange,
  onSelectableStateChange,
}: FieldSelectionDropdownProps) => {
  const key = useId();
  const selectedOptions = useMemo(
    () => fieldOptions.filter((option) => selectedFieldIds.includes(option.id)),
    [fieldOptions, selectedFieldIds]
  );
  const multiselectListRef = useMultiselectScrollReflow(selectedFieldIds);

  const filledFieldIds = useMemo(
    () =>
      new Set(
        fieldMappings
          .filter((fieldMapping) => fieldMapping.sourceRefs.length > 0)
          .map((fieldMapping) => fieldMapping.fieldId)
      ),
    [fieldMappings]
  );
  const selectableOptions = useMemo(() => {
    if (isImageContent) {
      return fieldOptions.filter((option) => option.isAssetField === true);
    }
    return fieldOptions.filter((option) => isSelectableFieldType(option, selectedText));
  }, [fieldOptions, isImageContent, selectedText]);

  const hasUnsupportedFields = useMemo(
    () =>
      fieldOptions.some((option) =>
        isImageContent
          ? !option.isAssetField
          : !isSelectableFieldType(option, selectedText) && !option.isAssetField
      ),
    [fieldOptions, isImageContent, selectedText]
  );

  useEffect(() => {
    onSelectableStateChange?.({
      hasFieldOptions: fieldOptions.length > 0,
      hasSelectableOptions: selectableOptions.length > 0,
    });
  }, [fieldOptions.length, isImageContent, onSelectableStateChange, selectableOptions.length]);

  const handleSelectField = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked, value } = event.target;

    onSelectedFieldIdsChange((previous) =>
      checked
        ? previous.includes(value)
          ? previous
          : [...previous, value]
        : previous.filter((id) => id !== value)
    );
  };

  const currentSelection = selectedOptions.map((option) => option.fieldName);
  const placeholder =
    selectedOptions.length === 0 ? 'Select one or more' : `${selectedOptions.length} selected`;

  return (
    <FormControl as="div">
      <Multiselect
        key={key}
        currentSelection={currentSelection}
        placeholder={placeholder}
        popoverProps={{
          listMaxHeight: 280,
          listRef: multiselectListRef,
          placement: 'bottom',
          isAutoalignmentEnabled: false,
        }}>
        {fieldOptions.map((option) => {
          const fieldTypeDisplay = option.fieldDisplayType;
          const isDisabled = isImageContent
            ? !option.isAssetField
            : !isSelectableFieldType(option, selectedText);
          const isFilled = filledFieldIds.has(option.id);
          return (
            <Multiselect.Option
              key={`${key}-${option.id}`}
              value={option.id}
              itemId={option.id}
              isChecked={selectedFieldIds.includes(option.id)}
              isDisabled={isDisabled}
              onSelectItem={handleSelectField}
              className={optionRow}>
              <Flex gap="spacing2Xs">
                <Text as="div" fontColor="gray700" fontWeight="fontWeightDemiBold">
                  {option.fieldName}
                </Text>
                <Text as="div" fontColor="gray700" fontWeight="fontWeightNormal">
                  ({fieldTypeDisplay})
                </Text>
              </Flex>
              <Badge
                variant={isFilled ? 'positive' : 'secondary'}
                size="small"
                style={{ marginLeft: 'auto' }}>
                {isFilled ? 'Filled' : 'Empty'}
              </Badge>
            </Multiselect.Option>
          );
        })}
      </Multiselect>
      {hasUnsupportedFields && (
        <FormControl.HelpText style={{ fontSize: '0.7rem' }}>
          This app doesn&apos;t support edits for Reference, Boolean, Date &amp; time, Location or
          JSON fields. Use the entry editor instead.
        </FormControl.HelpText>
      )}
    </FormControl>
  );
};
