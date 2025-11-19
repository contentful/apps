import { ConfigAppSDK } from '@contentful/app-sdk';
import { Box, Heading, FormControl, TextInput, Autocomplete } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useState } from 'react';
import { AutocompleteItem } from '../utils/types';
import { getUniqueShortTextFields, normalizeString } from '../utils/override';

type ConfigureSectionProps = {
  separator: string;
  sourceFieldId: string;
  isSourceFieldMissing: boolean;
  onSeparatorChange: (value: string) => void;
  onSourceFieldIdChange: (fieldId: string) => void;
};

const ConfigureSection: React.FC<ConfigureSectionProps> = ({
  separator,
  sourceFieldId,
  isSourceFieldMissing,
  onSeparatorChange,
  onSourceFieldIdChange,
}) => {
  const sdk = useSDK<ConfigAppSDK>();
  const [fields, setFields] = useState<AutocompleteItem[]>([]);
  const [filteredSourceFields, setFilteredSourceFields] = useState<AutocompleteItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const contentTypes = await sdk.cma.contentType.getMany({
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
        });

        const uniqueFields = getUniqueShortTextFields(contentTypes);

        setFields(uniqueFields);
        setFilteredSourceFields(uniqueFields);
      } catch (error) {
        console.warn('[Error] Failed to load source fields:', error);
      }
    })();
  }, [sdk]);

  const handleSourceFieldInputChange = (name: string) => {
    if (!name) {
      onSourceFieldIdChange('');
      setFilteredSourceFields(fields);
      return;
    }

    const newFilteredItems = fields.filter((item) =>
      normalizeString(item.name).includes(normalizeString(name))
    );
    setFilteredSourceFields(newFilteredItems);
  };

  const handleSourceFieldIdSelection = (value: string) => {
    const selectedField = fields.find(
      (item) => normalizeString(item.name) === normalizeString(value)
    );
    if (selectedField) {
      onSourceFieldIdChange(selectedField.id);
    }
  };

  return (
    <Box>
      <Heading as="h3">Configure</Heading>
      <FormControl id="separator">
        <FormControl.Label marginBottom="spacingS">Separator</FormControl.Label>
        <TextInput value={separator} onChange={(e) => onSeparatorChange(e.target.value)} />
        <FormControl.HelpText marginTop="spacingS">
          The separator can be any character or symbol and will append to the entry name.
        </FormControl.HelpText>
      </FormControl>
      <FormControl id="sourceFieldId" isInvalid={isSourceFieldMissing}>
        <FormControl.Label marginBottom="spacingS" isRequired>
          Source field ID
        </FormControl.Label>
        <Autocomplete
          selectedItem={sourceFieldId}
          items={filteredSourceFields.map((field) => field.name)}
          onInputValueChange={handleSourceFieldInputChange}
          onSelectItem={handleSourceFieldIdSelection}
          placeholder="Search field name"
        />
        {isSourceFieldMissing && (
          <FormControl.ValidationMessage>Source field ID is required</FormControl.ValidationMessage>
        )}
        <FormControl.HelpText marginTop="spacingS">
          The source field ID should be the name of the field that you want to use from the parent
          entry. This will be applied to any content types that include the same field ID.
        </FormControl.HelpText>
      </FormControl>
    </Box>
  );
};

export default ConfigureSection;
