import React, { useState, useEffect } from 'react';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
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
import logger from '../utils/logger';
import { getSyncData, updateSyncData } from '../services/persistence-service';

// Define field mapping interface that aligns with the rest of the app
interface FieldData {
  id: string;
  name: string;
  type: string;
  value: any;
  isAsset: boolean;
  contentTypeId?: string;
}

const FieldMapper: React.FC = () => {
  const sdk = useSDK<FieldExtensionSDK>();
  const [mappingType, setMappingType] = useState<'profile' | 'event' | 'custom'>('profile');
  const [klaviyoProperty, setKlaviyoProperty] = useState<string>('');
  const [isMapped, setIsMapped] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [availableProperties, setAvailableProperties] = useState<string[]>([]);
  const [existingMappings, setExistingMappings] = useState<FieldData[]>([]);

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
    async function loadMappings() {
      try {
        setIsLoading(true);

        // Load mappings from persistence service (localStorage)
        const mappings = await getSyncData(sdk);
        setExistingMappings(mappings || []);

        // Get current content type and field
        const contentTypeId = sdk.contentType.sys.id;
        const fieldId = sdk.field.id;

        // Check if this field is already mapped
        const fieldMapping = mappings?.find(
          (m) => m.contentTypeId === contentTypeId && m.id === fieldId
        );

        if (fieldMapping) {
          // Try to determine the mapping type based on the klaviyo property name
          const property = fieldMapping.name;
          let detectedType: 'profile' | 'event' | 'custom' = 'custom';

          if (PROFILE_PROPERTIES.includes(property)) {
            detectedType = 'profile';
          } else if (EVENT_PROPERTIES.includes(property)) {
            detectedType = 'event';
          }

          setMappingType(detectedType);
          setKlaviyoProperty(property);
          setIsMapped(true);

          // Set available properties based on detected type
          updateAvailableProperties(detectedType);
        } else {
          // Set default available properties
          updateAvailableProperties('profile');
        }
      } catch (error) {
        logger.error('Error loading field mappings:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadMappings();
  }, [sdk]);

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

      // Get current content type and field
      const contentTypeId = sdk.contentType.sys.id;
      const fieldId = sdk.field.id;
      const fieldName = sdk.contentType.fields.find((f) => f.id === fieldId)?.name || fieldId;

      // Filter out any existing mapping for this field
      const filteredMappings = existingMappings.filter(
        (m) => !(m.contentTypeId === contentTypeId && m.id === fieldId)
      );

      // Create new field mapping
      const newMapping: FieldData = {
        id: fieldId,
        name: klaviyoProperty, // Use the klaviyo property as the name
        type: 'Text',
        value: '',
        isAsset: false,
        contentTypeId: contentTypeId,
      };

      // Add the new mapping
      const updatedMappings = [...filteredMappings, newMapping];

      // Save to persistence service
      await updateSyncData(updatedMappings);

      // Update local state
      setExistingMappings(updatedMappings);
      setIsMapped(true);

      // Notify success
      sdk.notifier.success('Field mapping saved successfully');

      // Broadcast change to other components
      window.postMessage(
        {
          type: 'updateFieldMappings',
          fieldMappings: updatedMappings,
        },
        '*'
      );
    } catch (error) {
      logger.error('Error saving field mapping:', error);
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

      // Get current content type and field
      const contentTypeId = sdk.contentType.sys.id;
      const fieldId = sdk.field.id;

      // Filter out this field mapping
      const updatedMappings = existingMappings.filter(
        (m) => !(m.contentTypeId === contentTypeId && m.id === fieldId)
      );

      // Save to persistence service
      await updateSyncData(updatedMappings);

      // Update local state
      setExistingMappings(updatedMappings);
      setIsMapped(false);
      setKlaviyoProperty('');
      setMappingType('profile');

      // Notify success
      sdk.notifier.success('Field mapping removed');

      // Broadcast change to other components
      window.postMessage(
        {
          type: 'updateFieldMappings',
          fieldMappings: updatedMappings,
        },
        '*'
      );
    } catch (error) {
      logger.error('Error removing field mapping:', error);
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
                  <Select.Option value="">-- Select a property --</Select.Option>
                  {availableProperties.map((prop) => (
                    <Select.Option key={prop} value={prop}>
                      {prop.replace('_', ' ')}
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

            <Flex justifyContent="flex-start" gap="spacingS">
              {isMapped ? (
                <>
                  <Button
                    variant="primary"
                    onClick={saveMapping}
                    isDisabled={isLoading || !klaviyoProperty}
                    isLoading={isLoading}>
                    Update Mapping
                  </Button>
                  <Button
                    variant="negative"
                    onClick={removeMapping}
                    isDisabled={isLoading}
                    isLoading={isLoading}>
                    Remove Mapping
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
          <Text fontColor="gray600">
            This field is mapped to the Klaviyo property: <strong>{klaviyoProperty}</strong>
          </Text>
        )}
      </Stack>
    </Box>
  );
};

export default FieldMapper;
