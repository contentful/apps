/**
 * ConditionEditor Component
 *
 * Allows users to configure a single condition (field, operator, value)
 */

import React, { useState, useEffect } from 'react';
import {
  FormControl,
  Select,
  TextInput,
  IconButton,
  Flex,
  Button,
  Pill,
  Text,
} from '@contentful/f36-components';
import { DeleteIcon, PlusIcon } from '@contentful/f36-icons';
import { useSDK, useCMA } from '@contentful/react-apps-toolkit';
import { EditorAppSDK } from '@contentful/app-sdk';
import { Condition, FieldType, ConditionOperator } from '../../types/rules';
import {
  getOperatorsForFieldType,
  getOperatorLabel,
  operatorRequiresValue,
  getInputTypeForFieldType,
} from '../../utils/operatorMappings';
import { EntrySelector } from './EntrySelector';

interface ConditionEditorProps {
  /** The condition being edited */
  condition: Condition;
  /** Available fields from the content type */
  availableFields: Array<{
    id: string;
    name: string;
    type: FieldType;
    validations?: any[];
    items?: any;
  }>;
  /** Callback when condition changes */
  onChange: (condition: Condition) => void;
  /** Callback when delete is requested */
  onDelete: () => void;
  /** Whether the editor is disabled */
  disabled?: boolean;
}

export const ConditionEditor: React.FC<ConditionEditorProps> = ({
  condition,
  availableFields,
  onChange,
  onDelete,
  disabled = false,
}) => {
  const sdk = useSDK<EditorAppSDK>();
  const cma = useCMA();
  const selectedField = availableFields.find((f) => f.id === condition.fieldId);
  const availableOperators = selectedField ? getOperatorsForFieldType(selectedField.type) : [];

  const showValueInput = operatorRequiresValue(condition.operator);
  const isReferenceField = selectedField?.type === 'Link' || selectedField?.type === 'Array';

  const [isEntrySelectorOpen, setIsEntrySelectorOpen] = useState(false);
  const [selectedEntryTitle, setSelectedEntryTitle] = useState<string>('');
  const [selectedEntries, setSelectedEntries] = useState<Array<{ id: string; title: string }>>([]);
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);

  // Load entry title(s) when condition has a value
  useEffect(() => {
    if (!isReferenceField || !condition.value || typeof condition.value !== 'string') {
      setSelectedEntries([]);
      setSelectedEntryTitle('');
      return;
    }

    const loadEntryTitles = async () => {
      setIsLoadingEntry(true);
      try {
        const valueStr = String(condition.value);

        // Check if it's multiple entries (comma-separated)
        const entryIds = valueStr.includes(',')
          ? valueStr.split(',').map((id: string) => id.trim())
          : [valueStr];

        // Load all entries
        const entryPromises = entryIds.map(async (entryId: string) => {
          try {
            const entry = await cma.entry.get({
              spaceId: sdk.ids.space,
              environmentId: sdk.ids.environment,
              entryId,
            });

            // Try to get a meaningful title from the entry
            let title = 'Untitled Entry';
            if (entry.fields) {
              const titleFields = ['title', 'name', 'label', 'heading'];
              for (const fieldName of titleFields) {
                if (entry.fields[fieldName]) {
                  const fieldValue = entry.fields[fieldName];
                  const localeValue = Object.values(fieldValue)[0];
                  if (localeValue && typeof localeValue === 'string') {
                    title = localeValue;
                    break;
                  }
                }
              }
            }

            return { id: entryId, title };
          } catch (err) {
            console.error('Error loading entry:', entryId, err);
            return { id: entryId, title: 'Unknown Entry' };
          }
        });

        const loadedEntries = await Promise.all(entryPromises);
        setSelectedEntries(loadedEntries);

        // For backward compatibility, also set single title
        if (loadedEntries.length === 1) {
          setSelectedEntryTitle(loadedEntries[0].title);
        }
      } catch (err) {
        console.error('Error loading entry titles:', err);
        setSelectedEntries([]);
        setSelectedEntryTitle('Unknown Entry');
      } finally {
        setIsLoadingEntry(false);
      }
    };

    loadEntryTitles();
  }, [isReferenceField, condition.value, cma, sdk.ids.space, sdk.ids.environment]);

  const handleFieldChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const fieldId = event.target.value;
    const field = availableFields.find((f) => f.id === fieldId);

    if (field) {
      // Reset operator and value when field changes
      const newOperators = getOperatorsForFieldType(field.type);
      onChange({
        ...condition,
        fieldId,
        fieldType: field.type,
        operator: newOperators[0] || condition.operator,
        value: undefined,
      });
    }
  };

  const handleOperatorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const operator = event.target.value as ConditionOperator;
    onChange({
      ...condition,
      operator,
      value: operatorRequiresValue(operator) ? condition.value : undefined,
    });
  };

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputType = selectedField ? getInputTypeForFieldType(selectedField.type) : 'text';
    let value: string | number | boolean | undefined;

    if (inputType === 'number') {
      value = parseFloat(event.target.value);
    } else if (inputType === 'checkbox') {
      value = event.target.checked;
    } else {
      value = event.target.value;
    }

    onChange({
      ...condition,
      value,
    });
  };

  const handleEntrySelect = (entryId: string, entryTitle: string) => {
    setSelectedEntryTitle(entryTitle);
    onChange({
      ...condition,
      value: entryId,
    });
  };

  const handleMultipleEntriesSelect = (entries: Array<{ id: string; title: string }>) => {
    // For multiple entries, store as comma-separated IDs
    const entryIds = entries.map((e) => e.id).join(',');
    setSelectedEntries(entries);
    onChange({
      ...condition,
      value: entryIds,
    });
  };

  const handleRemoveEntry = (entryIdToRemove?: string) => {
    if (!entryIdToRemove) {
      // Remove all (for single reference)
      setSelectedEntryTitle('');
      setSelectedEntries([]);
      onChange({
        ...condition,
        value: undefined,
      });
    } else {
      // Remove specific entry (for multiple references)
      const remainingEntries = selectedEntries.filter((e) => e.id !== entryIdToRemove);
      setSelectedEntries(remainingEntries);

      if (remainingEntries.length === 0) {
        onChange({
          ...condition,
          value: undefined,
        });
      } else {
        const entryIds = remainingEntries.map((e) => e.id).join(',');
        onChange({
          ...condition,
          value: entryIds,
        });
      }
    }
  };

  return (
    <Flex alignItems="flex-end" gap="spacingS">
      <FormControl isRequired style={{ flex: 1, minWidth: '200px' }}>
        <FormControl.Label>Field</FormControl.Label>
        <Select value={condition.fieldId} onChange={handleFieldChange} isDisabled={disabled}>
          <Select.Option value="">Select a field</Select.Option>
          {availableFields.map((field) => (
            <Select.Option key={field.id} value={field.id}>
              {field.name} ({field.type})
            </Select.Option>
          ))}
        </Select>
      </FormControl>

      <FormControl isRequired style={{ flex: 1, minWidth: '150px' }}>
        <FormControl.Label>Operator</FormControl.Label>
        <Select
          value={condition.operator}
          onChange={handleOperatorChange}
          isDisabled={disabled || !selectedField}>
          {availableOperators.map((op) => (
            <Select.Option key={op} value={op}>
              {getOperatorLabel(op)}
            </Select.Option>
          ))}
        </Select>
      </FormControl>

      {showValueInput && (
        <FormControl isRequired style={{ flex: 1, minWidth: '150px' }}>
          <FormControl.Label>Value</FormControl.Label>
          {isReferenceField ? (
            <Flex flexDirection="column" gap="spacingXs" style={{ width: '100%' }}>
              {condition.value && (
                <>
                  {selectedField?.type === 'Array' && selectedEntries.length > 0 ? (
                    <Flex flexWrap="wrap" gap="spacingXs">
                      {selectedEntries.map((entry) => (
                        <Pill
                          key={entry.id}
                          label={entry.title}
                          onClose={() => handleRemoveEntry(entry.id)}
                          onDrag={undefined}
                        />
                      ))}
                    </Flex>
                  ) : (
                    <Pill
                      label={selectedEntryTitle || `Entry: ${condition.value}`}
                      onClose={() => handleRemoveEntry()}
                      onDrag={undefined}
                    />
                  )}
                </>
              )}
              <Button
                variant="secondary"
                startIcon={<PlusIcon />}
                onClick={() => setIsEntrySelectorOpen(true)}
                isDisabled={disabled}>
                {condition.value
                  ? selectedField?.type === 'Array'
                    ? 'Edit Entries'
                    : 'Change Entry'
                  : selectedField?.type === 'Array'
                  ? 'Select Entries'
                  : 'Select Entry'}
              </Button>
            </Flex>
          ) : (
            <TextInput
              type={selectedField ? getInputTypeForFieldType(selectedField.type) : 'text'}
              value={condition.value?.toString() || ''}
              onChange={handleValueChange}
              isDisabled={disabled}
              placeholder="Enter value"
            />
          )}
        </FormControl>
      )}

      <IconButton
        variant="transparent"
        icon={<DeleteIcon />}
        aria-label="Delete condition"
        onClick={onDelete}
        isDisabled={disabled}
        style={{ alignSelf: 'center' }}
      />

      {isReferenceField && (
        <EntrySelector
          isOpen={isEntrySelectorOpen}
          onClose={() => setIsEntrySelectorOpen(false)}
          onSelect={handleEntrySelect}
          onSelectMultiple={handleMultipleEntriesSelect}
          spaceId={sdk.ids.space}
          environmentId={sdk.ids.environment}
          allowMultiple={selectedField?.type === 'Array'}
          initialSelectedIds={selectedEntries.map((e) => e.id)}
        />
      )}
    </Flex>
  );
};
