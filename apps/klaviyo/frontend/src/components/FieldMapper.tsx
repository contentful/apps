import React, { useState, useEffect } from 'react';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '../hooks/useSDK';
import {
  Box,
  Button,
  Form,
  FormControl,
  Select,
  TextInput,
  Flex,
  Text,
  Paragraph,
  Stack,
} from '@contentful/f36-components';
import { FieldMapping, MappedField } from '../config/klaviyo';

const FieldMapper: React.FC = () => {
  const sdk = useSDK<FieldExtensionSDK>();
  const [mappingType, setMappingType] = useState<'profile' | 'event' | 'custom'>('profile');
  const [klaviyoProperty, setKlaviyoProperty] = useState<string>('');
  const [isMapped, setIsMapped] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [availableProperties, setAvailableProperties] = useState<string[]>([]);

  // Profile properties (you can expand this list)
  const PROFILE_PROPERTIES = [
    'email',
    'first_name',
    'last_name',
    'phone_number',
    'external_id',
    'title',
    'organization',
    'city',
    'region',
    'country',
    'zip',
    'custom_property',
  ];

  // Event properties (you can expand this list)
  const EVENT_PROPERTIES = ['event_name', 'value', 'items', 'custom_property'];

  useEffect(() => {
    async function checkExistingMapping() {
      try {
        setIsLoading(true);

        // Get app installation parameters
        const parameters = sdk.parameters.installation;
        const fieldMappings = (parameters?.fieldMappings as FieldMapping[]) || [];

        // Get current content type and field
        const contentTypeId = sdk.contentType.sys.id;
        const fieldId = sdk.field.id;

        // Check if this field is already mapped
        const contentTypeMapping = fieldMappings.find((m) => m.contentTypeId === contentTypeId);

        if (contentTypeMapping) {
          const fieldMapping = contentTypeMapping.fields.find((f) => f.fieldId === fieldId);

          if (fieldMapping) {
            setMappingType(fieldMapping.mappingType);
            setKlaviyoProperty(fieldMapping.klaviyoProperty);
            setIsMapped(true);
          }
        }

        // Set available properties based on mapping type
        updateAvailableProperties(mappingType);
      } catch (error) {
        console.error('Error checking existing mapping:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkExistingMapping();
  }, [sdk.contentType.sys.id, sdk.field.id, sdk.parameters.installation]);

  const updateAvailableProperties = (type: 'profile' | 'event' | 'custom') => {
    if (type === 'profile') {
      setAvailableProperties(PROFILE_PROPERTIES);
    } else if (type === 'event') {
      setAvailableProperties(EVENT_PROPERTIES);
    } else {
      setAvailableProperties([]);
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as 'profile' | 'event' | 'custom';
    setMappingType(type);
    updateAvailableProperties(type);

    // Reset property when type changes
    setKlaviyoProperty('');
  };

  const saveMapping = async () => {
    try {
      setIsLoading(true);

      // Get app installation parameters
      const parameters = sdk.parameters.installation;
      const fieldMappings = [...((parameters?.fieldMappings as FieldMapping[]) || [])];

      // Get current content type and field
      const contentTypeId = sdk.contentType.sys.id;
      const fieldId = sdk.field.id;

      // Create new field mapping
      const newMapping: MappedField = {
        fieldId,
        klaviyoProperty,
        mappingType,
        lastMappedAt: Date.now(),
      };

      // Check if this content type is already in mappings
      const contentTypeIndex = fieldMappings.findIndex((m) => m.contentTypeId === contentTypeId);

      if (contentTypeIndex >= 0) {
        // Content type exists, check if field is already mapped
        const fieldIndex = fieldMappings[contentTypeIndex].fields.findIndex(
          (f) => f.fieldId === fieldId
        );

        if (fieldIndex >= 0) {
          // Update existing field mapping
          fieldMappings[contentTypeIndex].fields[fieldIndex] = newMapping;
        } else {
          // Add new field mapping
          fieldMappings[contentTypeIndex].fields.push(newMapping);
        }
      } else {
        // Add new content type mapping
        fieldMappings.push({
          contentTypeId,
          fields: [newMapping],
        });
      }

      // Save updated mappings to installation parameters via the parent window
      // This is a workaround since FieldExtensionSDK doesn't have app.setParameters
      window.parent.postMessage(
        {
          type: 'updateFieldMappings',
          fieldMappings,
        },
        '*'
      );

      setIsMapped(true);
      sdk.notifier.success('Field mapping saved successfully');
    } catch (error) {
      console.error('Error saving field mapping:', error);
      sdk.notifier.error(
        `Failed to save mapping: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const removeMapping = async () => {
    try {
      setIsLoading(true);

      // Get app installation parameters
      const parameters = sdk.parameters.installation;
      const fieldMappings = [...((parameters?.fieldMappings as FieldMapping[]) || [])];

      // Get current content type and field
      const contentTypeId = sdk.contentType.sys.id;
      const fieldId = sdk.field.id;

      // Find content type in mappings
      const contentTypeIndex = fieldMappings.findIndex((m) => m.contentTypeId === contentTypeId);

      if (contentTypeIndex >= 0) {
        // Filter out this field
        fieldMappings[contentTypeIndex].fields = fieldMappings[contentTypeIndex].fields.filter(
          (f) => f.fieldId !== fieldId
        );

        // If no fields left, remove the content type mapping
        if (fieldMappings[contentTypeIndex].fields.length === 0) {
          fieldMappings.splice(contentTypeIndex, 1);
        }

        // Save updated mappings to installation parameters via the parent window
        window.parent.postMessage(
          {
            type: 'updateFieldMappings',
            fieldMappings,
          },
          '*'
        );

        setIsMapped(false);
        setKlaviyoProperty('');
        setMappingType('profile');
        sdk.notifier.success('Field mapping removed');
      }
    } catch (error) {
      console.error('Error removing field mapping:', error);
      sdk.notifier.error(
        `Failed to remove mapping: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box padding="spacingM">
      <Stack spacing="spacingM">
        <Paragraph>
          Map this Contentful field to a Klaviyo property. When this field changes, the mapped data
          will be sent to Klaviyo.
        </Paragraph>

        <Form>
          <Stack spacing="spacingM">
            <FormControl>
              <FormControl.Label>Mapping Type</FormControl.Label>
              <Select
                id="mapping-type"
                name="mapping-type"
                value={mappingType}
                onChange={handleTypeChange}
                isDisabled={isLoading}>
                <Select.Option value="profile">Profile Property</Select.Option>
                <Select.Option value="event">Event Property</Select.Option>
                <Select.Option value="custom">Custom Property</Select.Option>
              </Select>
            </FormControl>

            {mappingType !== 'custom' ? (
              <FormControl>
                <FormControl.Label>Klaviyo Property</FormControl.Label>
                <Select
                  id="klaviyo-property"
                  name="klaviyo-property"
                  value={klaviyoProperty}
                  onChange={(e) => setKlaviyoProperty(e.target.value)}
                  isDisabled={isLoading}>
                  <Select.Option value="">Select a property</Select.Option>
                  {availableProperties.map((prop) => (
                    <Select.Option key={prop} value={prop}>
                      {prop.replace(/_/g, ' ')}
                    </Select.Option>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <FormControl>
                <FormControl.Label>Custom Property Name</FormControl.Label>
                <TextInput
                  id="custom-property"
                  name="custom-property"
                  value={klaviyoProperty}
                  onChange={(e) => setKlaviyoProperty(e.target.value)}
                  placeholder="Enter custom property name"
                  isDisabled={isLoading}
                />
              </FormControl>
            )}

            <Flex justifyContent="space-between">
              {isMapped ? (
                <>
                  <Button
                    variant="negative"
                    onClick={removeMapping}
                    isDisabled={isLoading}
                    isLoading={isLoading}>
                    Remove Mapping
                  </Button>

                  <Button
                    variant="primary"
                    onClick={saveMapping}
                    isDisabled={isLoading || !klaviyoProperty}
                    isLoading={isLoading}>
                    Update Mapping
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  onClick={saveMapping}
                  isDisabled={isLoading || !klaviyoProperty}
                  isLoading={isLoading}>
                  Save Mapping
                </Button>
              )}
            </Flex>
          </Stack>
        </Form>

        {isMapped && (
          <Box
            padding="spacingM"
            backgroundColor="colorWhite"
            border="1px solid #E5EBED"
            borderRadius="4px">
            <Text fontWeight="fontWeightMedium">Current Mapping:</Text>
            <Flex marginTop="spacingXs">
              <Text>This field</Text>
              <Text margin="spacingXs">→</Text>
              <Text fontWeight="fontWeightMedium">
                {mappingType} property: {klaviyoProperty}
              </Text>
            </Flex>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default FieldMapper;
