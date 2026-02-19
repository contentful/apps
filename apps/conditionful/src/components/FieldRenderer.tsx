/**
 * FieldRenderer Component
 * 
 * Renders entry fields with support for disabled/grayed-out state
 * when hidden by conditional rules
 */

import React from 'react';
import {
  FormControl,
  TextInput,
  Textarea,
  Checkbox,
  Stack,
  Text,
} from '@contentful/f36-components';
import { EntryFieldAPI } from '@contentful/app-sdk';
import { FieldType } from '../types/rules';

interface FieldRendererProps {
  /** The field API from the SDK */
  field: EntryFieldAPI;
  /** The field's display name */
  fieldName: string;
  /** The field's type */
  fieldType: FieldType;
  /** Whether the field is hidden by rules (grayed out) */
  isHidden: boolean;
  /** The current field value */
  value: string | number | boolean | Date | null | undefined;
  /** Callback when field value changes */
  onChange: (value: string | number | boolean | null) => void;
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  fieldName,
  fieldType,
  isHidden,
  value,
  onChange,
}) => {
  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(event.target.value);
    onChange(isNaN(numValue) ? null : numValue);
  };

  const handleBooleanChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const renderFieldInput = () => {
    switch (fieldType) {
      case 'Symbol':
        return (
          <TextInput
            value={value?.toString() || ''}
            onChange={handleTextChange}
            isDisabled={isHidden}
            placeholder={`Enter ${fieldName}`}
          />
        );

      case 'Text':
        return (
          <Textarea
            value={value?.toString() || ''}
            onChange={handleTextChange}
            isDisabled={isHidden}
            placeholder={`Enter ${fieldName}`}
            rows={4}
          />
        );

      case 'Integer':
      case 'Number':
        return (
          <TextInput
            type="number"
            value={value?.toString() || ''}
            onChange={handleNumberChange}
            isDisabled={isHidden}
            placeholder={`Enter ${fieldName}`}
          />
        );

      case 'Date':
        return (
          <TextInput
            type="date"
            value={value?.toString().split('T')[0] || ''}
            onChange={handleDateChange}
            isDisabled={isHidden}
          />
        );

      case 'Boolean':
        return (
          <Checkbox
            id={`field-${field.id}`}
            isChecked={Boolean(value)}
            onChange={handleBooleanChange}
            isDisabled={isHidden}
          >
            {fieldName}
          </Checkbox>
        );

      default:
        return (
          <Text fontColor="gray500">
            Unsupported field type: {fieldType}
          </Text>
        );
    }
  };

  return (
    <Stack
      flexDirection="column"
      spacing="spacingXs"
      style={{
        opacity: isHidden ? 0.5 : 1,
        transition: 'opacity 0.2s ease-in-out',
      }}
    >
      {fieldType !== 'Boolean' && (
        <FormControl>
          <FormControl.Label>
            {fieldName}
            {isHidden && (
              <Text
                as="span"
                fontColor="gray500"
                fontSize="fontSizeS"
                style={{ marginLeft: '8px' }}
              >
                (Hidden by rules)
              </Text>
            )}
          </FormControl.Label>
          {renderFieldInput()}
        </FormControl>
      )}
      {fieldType === 'Boolean' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {renderFieldInput()}
          {isHidden && (
            <Text fontColor="gray500" fontSize="fontSizeS">
              (Hidden by rules)
            </Text>
          )}
        </div>
      )}
    </Stack>
  );
};

