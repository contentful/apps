import { useId, useMemo } from 'react';
import { Flex, Stack, Text } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import type { EditModalFieldMapping, EditModalFieldOption } from '@types';
import { useMultiselectScrollReflow } from '@hooks/useMultiselectReflow';
import { getFieldTypeLabel } from '../fieldFormatting';
import { isSelectableFieldType } from './utils';

interface FieldSelectionDropdownProps {
  selectedText: string;
  fieldOptions: EditModalFieldOption[];
  fieldMappings: EditModalFieldMapping[];
  selectedFieldIds: string[];
  /** Functional updates avoid stale `selectedFieldIds` when selecting multiple fields quickly. */
  onSelectedFieldIdsChange: (updater: (previous: string[]) => string[]) => void;
}

export const FieldSelectionDropdown = ({
  selectedText,
  fieldOptions,
  fieldMappings,
  selectedFieldIds,
  onSelectedFieldIdsChange,
}: FieldSelectionDropdownProps) => {
  const key = useId();
  const selectedOptions = useMemo(
    () => fieldOptions.filter((option) => selectedFieldIds.includes(option.id)),
    [fieldOptions, selectedFieldIds]
  );
  const multiselectListRef = useMultiselectScrollReflow(selectedFieldIds);

  const filledFieldIds = useMemo(
    () => new Set(fieldMappings.map((fieldMapping) => fieldMapping.fieldId)),
    [fieldMappings]
  );

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
    <Stack flexDirection="column" alignItems="start">
      <Multiselect
        key={key}
        currentSelection={currentSelection}
        placeholder={placeholder}
        popoverProps={{
          listMaxHeight: 360,
          listRef: multiselectListRef,
        }}>
        {fieldOptions.map((option) =>
          (() => {
            const fieldTypeDisplay = getFieldTypeLabel(option.fieldType);
            const isDisabled = !isSelectableFieldType(fieldTypeDisplay, selectedText);
            const isFilled = filledFieldIds.has(option.id);
            return (
              <Multiselect.Option
                key={`${key}-${option.id}`}
                value={option.id}
                itemId={option.id}
                isChecked={selectedFieldIds.includes(option.id)}
                isDisabled={isDisabled}
                onSelectItem={handleSelectField}>
                <Flex gap="spacingS">
                  <Flex gap="spacing2Xs">
                    <Text as="div" fontColor="gray700" fontWeight="fontWeightDemiBold">
                      {option.fieldName}
                    </Text>
                    <Text as="div" fontColor="gray700" fontWeight="fontWeightNormal">
                      ({fieldTypeDisplay})
                    </Text>
                  </Flex>
                  <Text as="div" fontColor="gray700" fontWeight="fontWeightNormal">
                    {isFilled ? 'Filled' : 'Empty'}
                  </Text>
                </Flex>
              </Multiselect.Option>
            );
          })()
        )}
      </Multiselect>
    </Stack>
  );
};
