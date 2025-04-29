import React, { useEffect, useState } from 'react';
import { DialogExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '../hooks/useSDK';
import {
  Box,
  Button,
  Flex,
  Form,
  Heading,
  Note,
  Stack,
  Text,
  Subheading,
  Pill,
} from '@contentful/f36-components';
import { SyncContent } from '../utils/klaviyo-api-service';
import { FieldMapping } from '../config/klaviyo';
import logger from '../utils/logger';

interface Field {
  id: string;
  name: string;
  type: string;
}

const FieldSelectDialog: React.FC<{ entry: any; mappings: FieldMapping[] }> = ({
  entry,
  mappings,
}) => {
  const sdk = useSDK<DialogExtensionSDK>();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<Field[]>([]);
  const [hoveredField, setHoveredField] = useState<string | null>(null);

  // Get the parameters passed to this dialog
  const {
    fields: availableFields = [],
    preSelectedFields = [],
    showSyncButton = false,
    contentTypeId = '',
    currentEntry = '',
  } = (sdk.parameters.invocation as {
    fields?: Field[];
    preSelectedFields?: string[];
    showSyncButton?: boolean;
    contentTypeId?: string;
    currentEntry?: string;
  }) || {};

  useEffect(() => {
    // Initialize fields and preselections
    if (availableFields && Array.isArray(availableFields)) {
      setFields(availableFields);
      setFilteredOptions(availableFields);
    }

    if (preSelectedFields && Array.isArray(preSelectedFields)) {
      setSelectedFields(preSelectedFields);
    }

    // Set dialog size
    sdk.window.updateHeight(500);
  }, [availableFields, preSelectedFields]);

  useEffect(() => {
    // Filter options based on search query
    if (!searchQuery) {
      // Show only unselected fields when no search query
      setFilteredOptions(fields.filter((field) => !selectedFields.includes(field.id)));
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = fields.filter(
      (field) =>
        !selectedFields.includes(field.id) &&
        (field.name.toLowerCase().includes(query) || field.id.toLowerCase().includes(query))
    );
    setFilteredOptions(filtered);
  }, [searchQuery, fields, selectedFields]);

  const handleFieldSelect = (fieldId: string) => {
    // Add the field to selected fields
    setSelectedFields((prev) => [...prev, fieldId]);
    // Clear the search
    setSearchQuery('');
  };

  const handleFieldRemove = (fieldId: string) => {
    // Remove the field from selected fields
    setSelectedFields((prev) => prev.filter((id) => id !== fieldId));
  };

  const handleSaveClick = () => {
    try {
      logger.log('[FieldSelectDialog] Saving mappings...');

      // First, get current mappings directly from localStorage for consistency
      const existingMappingsStr = localStorage.getItem('klaviyo_field_mappings');
      let existingMappings = [];
      try {
        if (existingMappingsStr) {
          existingMappings = JSON.parse(existingMappingsStr);
          logger.log('[FieldSelectDialog] Found existing mappings:', existingMappings);
        }
      } catch (parseError) {
        logger.error('[FieldSelectDialog] Error parsing existing mappings:', parseError);
      }

      // Create new mapping objects
      const newMappings = selectedFields.map((fieldId) => {
        const field = fields.find((f) => f.id === fieldId);
        return {
          id: fieldId,
          name: field?.name || fieldId,
          type: field?.type || 'Text',
          value: '',
          contentTypeId: contentTypeId || '',
          isAsset: field?.type === 'Asset' || field?.type === 'AssetLink' || false,
        };
      });

      logger.log('[FieldSelectDialog] New mappings:', newMappings);

      // Merge with existing mappings (filtering out any for the same content type)
      let updatedMappings = [...existingMappings];
      if (contentTypeId) {
        // Remove any mappings for this content type
        updatedMappings = updatedMappings.filter(
          (mapping: any) => mapping.contentTypeId !== contentTypeId
        );
      }

      // Add the new mappings
      updatedMappings = [...updatedMappings, ...newMappings];

      logger.log('[FieldSelectDialog] Final merged mappings to save:', updatedMappings);

      // Save directly to localStorage first for immediate sharing
      localStorage.setItem('klaviyo_field_mappings', JSON.stringify(updatedMappings));

      // Broadcast the update via a postMessage
      window.postMessage(
        {
          type: 'updateFieldMappings',
          fieldMappings: updatedMappings,
        },
        '*'
      );

      // Return the selected fields and mappings to the calling component
      // This is critical for the Sidebar to properly receive the mappings
      sdk.close({
        selectedFields,
        mappings: updatedMappings,
        success: true,
      });
    } catch (error) {
      logger.error('[FieldSelectDialog] Error saving mappings:', error);
      sdk.close({
        error: 'Failed to save mappings',
        success: false,
      });
    }
  };

  const handleSyncClick = async () => {
    if (selectedFields.length === 0) {
      setSyncMessage('Please select at least one field');
      return;
    }

    setIsSyncing(true);
    setSyncMessage('Syncing to Klaviyo...');

    try {
      // Convert to the format expected by syncContent
      const formattedMappings = selectedFields.map((fieldId) => {
        const field = fields.find((f) => f.id === fieldId);
        return {
          contentfulFieldId: fieldId,
          klaviyoBlockName: field?.name || fieldId,
          fieldType: 'text', // Default to text for simplicity
        };
      });

      // Sync using the parent context SDK (e.g. sidebar)
      const syncContentService = new SyncContent(JSON.parse(currentEntry));
      await syncContentService.syncContent(sdk, formattedMappings);

      setSyncMessage('Fields synced to Klaviyo. Closing dialog...');

      // Return both selected fields and a sync action
      setTimeout(() => {
        sdk.close({
          action: 'sync',
          selectedFields,
        });
      }, 1500);
    } catch (error) {
      logger.error('Error in sync:', error);
      setSyncMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Get field by ID
  const getFieldById = (fieldId: string) => fields.find((f) => f.id === fieldId);

  return (
    <Box padding="spacingL">
      <Form>
        <Stack spacing="spacingL" flexDirection="column">
          <Heading>Select Fields to Map to Klaviyo</Heading>

          <Text>Select the fields you want to include in the Klaviyo sync:</Text>

          <Box>
            <Text fontWeight="fontWeightMedium" marginBottom="spacingS">
              Available Fields
            </Text>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to filter fields..."
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #DADADA',
                marginBottom: '16px',
              }}
            />

            <Box
              style={{
                maxHeight: '90px',
                overflow: 'auto',
                border: '1px solid #EEEEEE',
                borderRadius: '4px',
                padding: '8px',
              }}>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((field) => (
                  <Box
                    key={field.id}
                    padding="spacingXs"
                    onClick={() => handleFieldSelect(field.id)}
                    onMouseEnter={() => setHoveredField(field.id)}
                    onMouseLeave={() => setHoveredField(null)}
                    style={{
                      cursor: 'pointer',
                      borderBottom: '1px solid #EEEEEE',
                      backgroundColor: hoveredField === field.id ? '#F7F9FA' : 'transparent',
                    }}>
                    <Text>{field.name}</Text>
                    <Text fontColor="gray500" fontSize="fontSizeS">
                      ({field.type})
                    </Text>
                  </Box>
                ))
              ) : (
                <Text fontColor="gray500" style={{ textAlign: 'center', padding: 'spacingM' }}>
                  No matching fields found
                </Text>
              )}
            </Box>
          </Box>

          {selectedFields.length > 0 && (
            <Box>
              <Subheading marginBottom="spacingS">Selected Fields</Subheading>
              <Flex flexWrap="wrap" gap="spacingXs">
                {selectedFields.map((fieldId) => {
                  const field = getFieldById(fieldId);
                  if (!field) return null;

                  return (
                    <Pill
                      key={field.id}
                      label={`${field.name} (${field.type})`}
                      onClose={() => handleFieldRemove(field.id)}
                      style={{ marginBottom: '8px' }}
                    />
                  );
                })}
              </Flex>
            </Box>
          )}

          {syncMessage && (
            <Note variant={syncMessage.includes('Error') ? 'negative' : 'positive'}>
              {syncMessage}
            </Note>
          )}

          <Flex justifyContent="space-between">
            <Button variant="secondary" onClick={() => sdk.close()}>
              Cancel
            </Button>

            <Flex gap="spacingS">
              <Button
                variant="positive"
                onClick={handleSaveClick}
                isDisabled={selectedFields.length === 0}>
                Save Selections
              </Button>

              {showSyncButton && (
                <Button
                  variant="primary"
                  onClick={handleSyncClick}
                  isDisabled={selectedFields.length === 0}
                  isLoading={isSyncing}>
                  Save & Sync to Klaviyo
                </Button>
              )}
            </Flex>
          </Flex>
        </Stack>
      </Form>
    </Box>
  );
};

export default FieldSelectDialog;
