import { Box, Flex, FormControl, Paragraph, TextInput } from '@contentful/f36-components';
import { SdkField } from '../utils/fieldsProcessing';
import tokens from '@contentful/f36-tokens';
import { useState } from 'react';
import { MODULE_NAME_PATTERN } from '../utils/utils';

interface FieldModuleNameMappingProps {
  selectedFields: SdkField[];
  moduleNameMapping: { [fieldId: string]: string };
  setModuleNameMapping: (mapping: { [fieldId: string]: string }) => void;
  inputDisabled: boolean;
  onValidationChange: (isValid: boolean) => void;
}

const FieldModuleNameMapping = ({
  selectedFields,
  moduleNameMapping,
  setModuleNameMapping,
  inputDisabled,
  onValidationChange,
}: FieldModuleNameMappingProps) => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateFieldModuleName = (
    fieldId: string,
    value: string,
    currentMapping: Record<string, string>
  ) => {
    if (!value) return 'Module name is required';

    if (!MODULE_NAME_PATTERN.test(value)) {
      if (value.includes(' ')) {
        const valueWithoutSpaces = value.replace(/\s/g, '');
        return MODULE_NAME_PATTERN.test(valueWithoutSpaces)
          ? 'No spaces'
          : 'No spaces or invalid characters';
      }
      return 'Invalid special character';
    }

    const isDuplicate = selectedFields.some(
      (otherField) =>
        otherField.uniqueId !== fieldId &&
        currentMapping[otherField.uniqueId].toLowerCase() === value.toLowerCase()
    );

    return isDuplicate ? 'Module name already exists' : '';
  };

  const handleFieldInputChange = (fieldId: string, value: string) => {
    const newModuleNameMapping = { ...moduleNameMapping, [fieldId]: value };
    setModuleNameMapping(newModuleNameMapping);

    const newErrors: Record<string, string> = {};
    selectedFields.forEach((field) => {
      const fieldValue = newModuleNameMapping[field.uniqueId] || '';
      const error = validateFieldModuleName(field.uniqueId, fieldValue, newModuleNameMapping);
      if (error !== '') {
        newErrors[field.uniqueId] = error;
      }
    });

    setFieldErrors(newErrors);

    onValidationChange(Object.keys(newErrors).length > 0);
  };

  return (
    <Box>
      <Paragraph>
        Optionally, name the Hubspot custom modules that will be synced to entry field content.
        Hubspot module names can include numbers, letters, hyphens (-), and underscores (_) but no
        spaces or special characters.
      </Paragraph>
      {selectedFields.map((field) => (
        <SingleFieldModuleNameMapping
          key={field.uniqueId}
          field={field}
          moduleName={moduleNameMapping[field.uniqueId]}
          inputDisabled={inputDisabled}
          fieldError={fieldErrors[field.uniqueId]}
          onInputChange={handleFieldInputChange}
        />
      ))}
    </Box>
  );
};

const SingleFieldModuleNameMapping = ({
  field,
  moduleName,
  inputDisabled,
  fieldError,
  onInputChange,
}: {
  field: SdkField;
  moduleName: string;
  inputDisabled: boolean;
  fieldError: string;
  onInputChange: (fieldId: string, value: string) => void;
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onInputChange(field.uniqueId, e.target.value);
  };

  return (
    <Box
      key={field.uniqueId}
      marginBottom="spacingM"
      padding="spacingM"
      style={{
        border: `1px solid ${tokens.gray300}`,
        borderRadius: tokens.borderRadiusSmall,
      }}>
      <Flex gap="spacingM" fullWidth>
        <Flex flex="1" flexDirection="column">
          <FormControl marginBottom="none">
            <FormControl.Label>Field name</FormControl.Label>
            <TextInput
              value={field.name}
              isDisabled
              aria-label={`Field name for ${field.name}`}
              style={{ color: tokens.gray500 }}
            />
          </FormControl>
        </Flex>
        <Flex flex="1" flexDirection="column">
          <FormControl isInvalid={!!fieldError} marginBottom="none">
            <FormControl.Label>Hubspot module name</FormControl.Label>
            <TextInput
              value={moduleName}
              isDisabled={inputDisabled}
              onChange={handleInputChange}
              aria-label={`Hubspot module name for ${field.name}`}
            />
            {fieldError && (
              <FormControl.ValidationMessage marginTop="spacingXs">
                {fieldError}
              </FormControl.ValidationMessage>
            )}
          </FormControl>
        </Flex>
      </Flex>
    </Box>
  );
};

export default FieldModuleNameMapping;
