import { useEffect, useId, useMemo, useState } from 'react';
import { Flex, Stack, Text } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import type { EditModalFieldMapping, EditModalFieldOption } from '@types';
import { useMultiselectScrollReflow } from '@hooks/useMultiselectReflow';

const EMPTY_SELECTED_FIELD_IDS: string[] = [];

interface FieldSelectionDropdownProps {
  fieldOptions: EditModalFieldOption[];
  fieldMappings: EditModalFieldMapping[];
  selectedFieldIds?: string[];
}

export const FieldSelectionDropdown = ({
  fieldOptions,
  fieldMappings,
  selectedFieldIds,
}: FieldSelectionDropdownProps) => {
  const key = useId();
  const propSelectedIds = selectedFieldIds ?? EMPTY_SELECTED_FIELD_IDS;
  const [selectedIds, setSelectedIds] = useState<string[]>(() => [...propSelectedIds]);
  const selectedOptions = useMemo(
    () => fieldOptions.filter((option) => selectedIds.includes(option.id)),
    [fieldOptions, selectedIds]
  );
  const multiselectListRef = useMultiselectScrollReflow(selectedIds);

  useEffect(() => {
    setSelectedIds([...propSelectedIds]);
  }, [propSelectedIds]);

  const filledFieldIds = useMemo(
    () => new Set(fieldMappings.map((fieldMapping) => fieldMapping.fieldId)),
    [fieldMappings]
  );

  const handleSelectField = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked, value } = event.target;

    setSelectedIds((previous) =>
      checked ? [...previous, value] : previous.filter((id) => id !== value)
    );
  };

  const currentSelection = selectedOptions.map((option) => option.fieldName);
  const placeholder =
    selectedOptions.length === 0 ? 'Select one or more' : `${selectedOptions.length} selected`;

  const isSelectableFieldType = (fieldType: string) => {
    const normalizedFieldType = fieldType.trim().toLowerCase();
    return normalizedFieldType === 'short text' || normalizedFieldType === 'long text';
  };

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
            const isDisabled = !isSelectableFieldType(option.fieldType);
            const isFilled = filledFieldIds.has(option.id);
            return (
              <Multiselect.Option
                key={`${key}-${option.id}`}
                value={option.id}
                itemId={option.id}
                isChecked={selectedIds.includes(option.id)}
                isDisabled={isDisabled}
                onSelectItem={handleSelectField}>
                <Flex gap="spacingS">
                  <Flex gap="spacing2Xs">
                    <Text as="div" fontColor="gray700" fontWeight="fontWeightDemiBold">
                      {option.fieldName}
                    </Text>
                    <Text as="div" fontColor="gray700" fontWeight="fontWeightNormal">
                      ({option.fieldType})
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
