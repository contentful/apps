import { Box, Flex, FormControl, Paragraph, TextInput } from '@contentful/f36-components';
import { SdkField } from '../utils/fieldsProcessing';
import tokens from '@contentful/f36-tokens';
import { useEffect, useState } from 'react';
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
  const [fieldValidations, setFieldValidations] = useState<{ [fieldId: string]: boolean }>({});

  useEffect(() => {
    const allFieldsValid = selectedFields.every((field) => fieldValidations[field.uniqueId]);
    onValidationChange(allFieldsValid);
  }, [fieldValidations, selectedFields, onValidationChange]);

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
          moduleNameMapping={moduleNameMapping}
          setModuleNameMapping={setModuleNameMapping}
          inputDisabled={inputDisabled}
          selectedFields={selectedFields}
          onValidationChange={(isValid) => {
            setFieldValidations((prev) => ({
              ...prev,
              [field.uniqueId]: isValid,
            }));
          }}
        />
      ))}
    </Box>
  );
};

const SingleFieldModuleNameMapping = ({
  field,
  moduleNameMapping,
  setModuleNameMapping,
  inputDisabled,
  selectedFields,
  onValidationChange,
}: {
  field: SdkField;
  moduleNameMapping: { [fieldId: string]: string };
  setModuleNameMapping: (mapping: { [fieldId: string]: string }) => void;
  inputDisabled: boolean;
  selectedFields: SdkField[];
  onValidationChange: (isValid: boolean) => void;
}) => {
  const [isValid, setIsValid] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const validateFieldModuleName = (fieldId: string, value: string) => {
    if (!value) {
      return { isValid: true, errorMessage: '' };
    }

    const isFormatValid = MODULE_NAME_PATTERN.test(value);

    if (!isFormatValid) {
      if (value.includes(' ')) {
        const valueWithoutSpaces = value.replace(/\s/g, '');
        if (!MODULE_NAME_PATTERN.test(valueWithoutSpaces)) {
          return { isValid: false, errorMessage: 'No spaces or invalid characters' };
        } else {
          return { isValid: false, errorMessage: 'No spaces' };
        }
      } else {
        return { isValid: false, errorMessage: 'Invalid special character' };
      }
    }

    const isDuplicate = selectedFields.some(
      (otherField) =>
        otherField.uniqueId !== fieldId && moduleNameMapping[otherField.uniqueId] === value
    );

    if (isDuplicate) {
      return { isValid: false, errorMessage: 'Module name already exists' };
    }

    return { isValid: true, errorMessage: '' };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newModuleNameMapping = { ...moduleNameMapping, [field.uniqueId]: value };
    setModuleNameMapping(newModuleNameMapping);
  };

  useEffect(() => {
    const currentValue = moduleNameMapping[field.uniqueId] || '';
    const validation = validateFieldModuleName(field.uniqueId, currentValue);
    setIsValid(validation.isValid);
    setErrorMessage(validation.errorMessage);
    onValidationChange(validation.isValid);
  }, [moduleNameMapping, field.uniqueId, selectedFields]);

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
          <FormControl isInvalid={!isValid} marginBottom="none">
            <FormControl.Label>Hubspot module name</FormControl.Label>
            <TextInput
              value={moduleNameMapping[field.uniqueId]}
              isDisabled={inputDisabled}
              onChange={handleInputChange}
              aria-label={`Hubspot module name for ${field.name}`}
            />
            {!isValid && (
              <FormControl.ValidationMessage marginTop="spacingXs">
                {errorMessage}
              </FormControl.ValidationMessage>
            )}
          </FormControl>
        </Flex>
      </Flex>
    </Box>
  );
};

export default FieldModuleNameMapping;
