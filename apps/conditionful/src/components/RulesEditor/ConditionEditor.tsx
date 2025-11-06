/**
 * ConditionEditor Component
 * 
 * Allows users to configure a single condition (field, operator, value)
 */

import React from 'react';
import {
  FormControl,
  Select,
  TextInput,
  IconButton,
  Stack,
} from '@contentful/f36-components';
import { DeleteIcon } from '@contentful/f36-icons';
import { Condition, FieldType, ConditionOperator } from '../../types/rules';
import {
  getOperatorsForFieldType,
  getOperatorLabel,
  operatorRequiresValue,
  getInputTypeForFieldType,
} from '../../utils/operatorMappings';

interface ConditionEditorProps {
  /** The condition being edited */
  condition: Condition;
  /** Available fields from the content type */
  availableFields: Array<{ id: string; name: string; type: FieldType }>;
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
  const selectedField = availableFields.find((f) => f.id === condition.fieldId);
  const availableOperators = selectedField
    ? getOperatorsForFieldType(selectedField.type)
    : [];

  const showValueInput = operatorRequiresValue(condition.operator);

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

  return (
    <Stack flexDirection="row" alignItems="flex-end" spacing="spacingS">
      <FormControl isRequired style={{ flex: 1, minWidth: '200px' }}>
        <FormControl.Label>Field</FormControl.Label>
        <Select
          value={condition.fieldId}
          onChange={handleFieldChange}
          isDisabled={disabled}
        >
          <Select.Option value="">Select a field</Select.Option>
          {availableFields.map((field) => (
            <Select.Option key={field.id} value={field.id}>
              {field.name} ({field.type})
            </Select.Option>
          ))}
        </Select>
      </FormControl>

      <FormControl isRequired style={{ flex: 1, minWidth: '150px' }}>
        <FormControl.Label>Condition</FormControl.Label>
        <Select
          value={condition.operator}
          onChange={handleOperatorChange}
          isDisabled={disabled || !selectedField}
        >
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
          <TextInput
            type={selectedField ? getInputTypeForFieldType(selectedField.type) : 'text'}
            value={condition.value?.toString() || ''}
            onChange={handleValueChange}
            isDisabled={disabled}
            placeholder="Enter value"
          />
        </FormControl>
      )}

      <IconButton
        variant="transparent"
        icon={<DeleteIcon />}
        aria-label="Delete condition"
        onClick={onDelete}
        isDisabled={disabled}
        size="small"
      />
    </Stack>
  );
};

