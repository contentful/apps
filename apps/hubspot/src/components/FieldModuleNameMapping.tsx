import { Box, Flex, FormControl, Paragraph, Text, TextInput } from '@contentful/f36-components';
import { SdkField } from '../utils/fieldsProcessing';
import tokens from '@contentful/f36-tokens';
import { useState } from 'react';
import { MODULE_NAME_PATTERN } from '../utils/utils';

interface FieldModuleNameMappingProps {
  selectedFields: SdkField[];
  moduleNameMapping: { [fieldId: string]: string };
  setModuleNameMapping: (mapping: { [fieldId: string]: string }) => void;
  inputDisabled: boolean;
}

const FieldModuleNameMapping = ({
  selectedFields,
  moduleNameMapping,
  setModuleNameMapping,
  inputDisabled,
}: FieldModuleNameMappingProps) => {
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
}: {
  field: SdkField;
  moduleNameMapping: { [fieldId: string]: string };
  setModuleNameMapping: (mapping: { [fieldId: string]: string }) => void;
  inputDisabled: boolean;
}) => {
  const [isValid, setIsValid] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setModuleNameMapping({ ...moduleNameMapping, [field.uniqueId]: value });

    if (MODULE_NAME_PATTERN.test(value)) {
      setIsValid(true);
      setErrorMessage('');
    } else {
      setIsValid(false);
      if (value.includes(' ')) {
        const valueWithoutSpaces = value.replace(/\s/g, '');
        if (!MODULE_NAME_PATTERN.test(valueWithoutSpaces)) {
          setErrorMessage('No spaces or invalid characters');
        } else {
          setErrorMessage('No spaces');
        }
      } else {
        setErrorMessage('Invalid special character');
      }
    }
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
