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
import { SyncContent } from '../services/klaviyo-sync-service';
import { FieldMapping } from '../config/klaviyo';
import logger from '../utils/logger';

// Extend Window interface to allow our custom property
declare global {
  interface Window {
    _klaviyoDialogResult?: {
      selectedFields?: string[];
      mappings?: any[];
      success?: boolean;
      action?: string;
      error?: string;
    };
  }
}

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

      // Show success message instead of closing the dialog
      setSyncMessage(
        'Field selections saved successfully. You can continue editing or close the dialog.'
      );

      // Store the mappings in state so they're available when the user closes manually
      window._klaviyoDialogResult = {
        selectedFields,
        mappings: updatedMappings,
        success: true,
      };
    } catch (error) {
      logger.error('[FieldSelectDialog] Error saving mappings:', error);
      setSyncMessage(
        `Error saving mappings: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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

        // Determine field type based on field information
        let fieldType = 'text'; // Default to text
        let isAssetField = false;

        // Check if this is an image/asset field
        if (field) {
          // Common asset field types in Contentful
          const assetTypes = ['Asset', 'Link', 'Media', 'Image', 'File'];
          const imageNamePatterns = [
            'image',
            'picture',
            'photo',
            'avatar',
            'logo',
            'banner',
            'icon',
            'thumbnail',
            'cover',
            'media',
          ];

          // Check field type for asset indicators
          isAssetField = assetTypes.some((type) =>
            field.type?.toLowerCase().includes(type.toLowerCase())
          );

          // If not detected by type, check field name for common image patterns
          if (!isAssetField) {
            isAssetField = imageNamePatterns.some(
              (pattern) =>
                field.id?.toLowerCase().includes(pattern.toLowerCase()) ||
                field.name?.toLowerCase().includes(pattern.toLowerCase())
            );
          }

          // Also try to check the actual content of the field from entry if available
          if (!isAssetField && currentEntry) {
            try {
              const parsedEntry = JSON.parse(currentEntry);
              const fieldContent = parsedEntry?.fields?.[fieldId];

              // Check if field contains asset reference structure
              if (fieldContent) {
                // Check _fieldLocales format
                if (fieldContent._fieldLocales && fieldContent._fieldLocales['en-US']?._value) {
                  const value = fieldContent._fieldLocales['en-US']._value;

                  // Check for direct asset references
                  if (
                    value?.sys?.type === 'Asset' ||
                    (value?.sys?.type === 'Link' && value?.sys?.linkType === 'Asset')
                  ) {
                    isAssetField = true;
                  }

                  // Check for stringified asset references
                  if (
                    typeof value === 'string' &&
                    value.includes('"sys"') &&
                    value.includes('"linkType":"Asset"')
                  ) {
                    isAssetField = true;
                  }
                }

                // Check traditional field format
                if (fieldContent['en-US']) {
                  const value = fieldContent['en-US'];

                  // Check for direct asset references
                  if (
                    value?.sys?.type === 'Asset' ||
                    (value?.sys?.type === 'Link' && value?.sys?.linkType === 'Asset')
                  ) {
                    isAssetField = true;
                  }

                  // Check for stringified asset references
                  if (
                    typeof value === 'string' &&
                    value.includes('"sys"') &&
                    value.includes('"linkType":"Asset"')
                  ) {
                    isAssetField = true;
                  }
                }
              }
            } catch (e) {
              // Silently ignore parsing errors
            }
          }

          if (isAssetField) {
            fieldType = 'image';
            logger.log(`Detected image field: ${field.name} (${field.id})`);
          }
        }

        return {
          contentfulFieldId: fieldId,
          klaviyoBlockName: field?.name || fieldId,
          fieldType: fieldType,
          isAssetField: isAssetField,
        };
      });

      // Try to safely extract entry and content type IDs
      let entryId: string | undefined;
      let contentTypeId: string | undefined;

      // From invocation parameters (most reliable)
      if (sdk.parameters.invocation && typeof sdk.parameters.invocation === 'object') {
        const invocation = sdk.parameters.invocation as Record<string, any>;
        if (invocation.entryId && typeof invocation.entryId === 'string') {
          entryId = invocation.entryId;
        }
        if (invocation.contentTypeId && typeof invocation.contentTypeId === 'string') {
          contentTypeId = invocation.contentTypeId;
        }
      }

      // Fall back to SDK IDs if available
      if (!entryId && sdk.ids) {
        const ids = sdk.ids as Record<string, any>;
        if (ids.entry && typeof ids.entry === 'string') {
          entryId = ids.entry;
        }
      }

      if (!contentTypeId && sdk.ids) {
        const ids = sdk.ids as Record<string, any>;
        if (ids.contentType && typeof ids.contentType === 'string') {
          contentTypeId = ids.contentType;
        }
      }

      logger.log('Starting sync with IDs:', { entryId, contentTypeId });

      // Sync using the parent context SDK (e.g. sidebar)
      const syncContentService = new SyncContent(currentEntry);
      await syncContentService.syncContent(sdk, formattedMappings, {
        entryId,
        contentTypeId,
      });

      setSyncMessage(
        'Fields successfully synced to Klaviyo! You can continue editing or close the dialog.'
      );

      // Store the result in a global variable so it's available when the dialog is closed manually
      window._klaviyoDialogResult = {
        action: 'sync',
        selectedFields,
      };
    } catch (error) {
      logger.error('Error in sync:', error);
      setSyncMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Get field by ID
  const getFieldById = (fieldId: string) => fields.find((f) => f.id === fieldId);

  // Add an effect to set the sdk.close handler
  useEffect(() => {
    // When the component mounts, set up a custom onClose handler
    const handleClose = () => {
      // Return the stored result when dialog is closed manually
      return (
        window._klaviyoDialogResult || {
          selectedFields,
          success: true,
        }
      );
    };

    // Store the original close method
    const originalClose = sdk.close;

    // Create a global variable to store the dialog result
    window._klaviyoDialogResult = undefined;

    // Override the close method to use our custom handler
    sdk.close = function () {
      return originalClose.call(this, handleClose());
    };

    // Restore original close method on unmount
    return () => {
      sdk.close = originalClose;
    };
  }, [sdk, selectedFields]);

  const handleCancel = () => {
    // Set result before closing
    window._klaviyoDialogResult = {
      selectedFields,
      success: true,
    };

    // Call the close method which will use our custom handler
    sdk.close();
  };

  return (
    <Box padding="spacingL">
      <Form>
        <Stack spacing="spacingL" flexDirection="column" alignItems="flex-start">
          <Heading marginBottom="none">Select Fields to Map to Klaviyo</Heading>

          <Text>Select the fields you want to include in the Klaviyo sync:</Text>

          <Box style={{ width: '100%' }}>
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
              }}
            />

            <Box
              style={{
                maxHeight: '90px',
                minWidth: '100%',
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

          <Flex justifyContent="space-between" style={{ width: '100%' }}>
            <Button variant="secondary" onClick={handleCancel}>
              Close
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
