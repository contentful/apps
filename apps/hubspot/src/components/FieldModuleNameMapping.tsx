import { Box, Flex, Text, TextInput } from '@contentful/f36-components';
import { SdkField } from '../utils/fieldsProcessing';
import tokens from '@contentful/f36-tokens';

interface FieldModuleNameMappingProps {
  selectedFields: SdkField[];
  moduleNameMapping: { [fieldId: string]: string };
  setModuleNameMapping: (mapping: { [fieldId: string]: string }) => void;
}

const FieldModuleNameMapping = ({
  selectedFields,
  moduleNameMapping,
  setModuleNameMapping,
}: FieldModuleNameMappingProps) => {
  const handleInputChange = (fieldId: string, value: string) => {
    setModuleNameMapping({ ...moduleNameMapping, [fieldId]: value });
  };

  return (
    <Box>
      <Text as="p" marginBottom="spacingM">
        Optionally, name the Hubspot custom modules that will be synced to entry field content.
      </Text>
      {selectedFields.map((field) => (
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
              <Text
                as="p"
                fontColor="gray900"
                fontWeight="fontWeightMedium"
                marginBottom="spacingXs">
                Field name
              </Text>
              <TextInput
                value={field.name}
                isDisabled
                aria-label={`Field name for ${field.name}`}
                style={{ color: tokens.gray500 }}
              />
            </Flex>
            <Flex flex="1" flexDirection="column">
              <Text
                as="p"
                fontColor="gray900"
                fontWeight="fontWeightMedium"
                marginBottom="spacingXs">
                Hubspot module name
              </Text>
              <TextInput
                value={moduleNameMapping[field.uniqueId]}
                onChange={(e) => handleInputChange(field.uniqueId, e.target.value)}
                aria-label={`Hubspot module name for ${field.name}`}
              />
            </Flex>
          </Flex>
        </Box>
      ))}
    </Box>
  );
};

export default FieldModuleNameMapping;
