import { useState, useEffect } from 'react';
import { DialogExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import {
  Box,
  Checkbox,
  Button,
  Stack,
  Heading,
  Text,
  FormControl,
} from '@contentful/f36-components';

// Field option structure passed from dialog parameters
interface FieldOption {
  id: string;
  name: string;
  type?: string;
}

// Dialog invocation parameters
interface InvocationParameters {
  fields: FieldOption[];
}

// Type guard to check if an object has fields property
const hasFieldsArray = (obj: any): obj is { fields: FieldOption[] } => {
  return obj && Array.isArray(obj.fields);
};

// Helper to filter unsupported field types
const filterUnsupportedFields = (fields: FieldOption[]): FieldOption[] => {
  return fields.filter((field) => {
    // Skip Boolean fields
    if (field.type && field.type === 'Boolean') {
      console.log(`Skipping Boolean field: ${field.name}`);
      return false;
    }

    // Skip Reference fields
    if (
      (field.type && field.type === 'Array' && field.name.toLowerCase().includes('reference')) ||
      (field.name.toLowerCase().includes('reference') && field.type && field.type.includes('Link'))
    ) {
      console.log(`Skipping Reference field: ${field.name}`);
      return false;
    }

    return true;
  });
};

const FieldSelectDialog = () => {
  const sdk = useSDK<DialogExtensionSDK>();
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [fields, setFields] = useState<FieldOption[]>([]);

  // Initialize dialog with field options
  useEffect(() => {
    const loadFields = () => {
      try {
        const params = sdk.parameters.invocation;

        if (params && typeof params === 'object' && hasFieldsArray(params)) {
          // Apply safety filter to exclude unsupported fields
          const filteredFields = filterUnsupportedFields(params.fields);
          setFields(filteredFields);
        } else {
          console.error('Invalid parameters format. Expected fields array.');
        }
      } catch (error) {
        console.error('Error loading field parameters:', error);
      }
    };

    loadFields();
    sdk.window.startAutoResizer();

    return () => sdk.window.stopAutoResizer();
  }, [sdk]);

  // Toggle field selection
  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields((prevSelected) =>
      prevSelected.includes(fieldId)
        ? prevSelected.filter((id) => id !== fieldId)
        : [...prevSelected, fieldId]
    );
  };

  // Submit selected fields
  const handleSubmit = () => {
    const fieldInfo = selectedFields.map((fieldId) => {
      const field = fields.find((f) => f.id === fieldId);

      // Check if it's an image field
      const isAsset =
        field?.type === 'Asset' ||
        field?.type === 'Link' ||
        field?.name?.includes('(Asset)') ||
        field?.name?.includes('(Link)');

      return { id: fieldId, isAsset };
    });

    sdk.close(fieldInfo);
  };

  // Cancel dialog
  const handleCancel = () => sdk.close([]);

  return (
    <Box padding="spacingM">
      <Stack spacing="spacingS" flexDirection="column" alignItems="flex-start">
        <Heading>Select Fields to Map to Klaviyo</Heading>
        <Text marginBottom="spacingXs">Select the fields you want to map to Klaviyo blocks:</Text>

        {fields.length > 0 ? (
          <Box width="100%">
            <Stack flexDirection="column" spacing="spacingXs">
              {fields.map((field) => (
                <FormControl
                  key={field.id}
                  marginBottom="none"
                  style={{ textAlign: 'left', width: '100%' }}>
                  <Checkbox
                    id={field.id}
                    name={field.id}
                    isChecked={selectedFields.includes(field.id)}
                    onChange={() => handleFieldToggle(field.id)}
                    style={{ justifyContent: 'flex-start', width: '100%', textAlign: 'left' }}>
                    {field.name}
                  </Checkbox>
                </FormControl>
              ))}
            </Stack>
          </Box>
        ) : (
          <Text marginBottom="spacingS">No fields available to map</Text>
        )}

        <Stack
          spacing="spacingS"
          justifyContent="flex-start"
          flexDirection="row"
          marginTop="spacingM">
          <Button variant="primary" onClick={handleSubmit} isDisabled={selectedFields.length === 0}>
            Generate Mappings
          </Button>
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default FieldSelectDialog;
