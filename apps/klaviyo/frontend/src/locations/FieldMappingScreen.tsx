import React, { useEffect, useState } from 'react';
import { PageExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '../hooks/useSDK';
import {
  Box,
  Button,
  Flex,
  Heading,
  Note,
  Paragraph,
  Stack,
  Text,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Modal,
  Select,
  FormControl,
  Pill,
  Subheading,
  Tabs,
  Spinner,
} from '@contentful/f36-components';
import { getSyncData, getLocalMappings } from '../services/persistence-service';
import { SyncContent } from '../services/klaviyo-sync-service';
import { SyncStatusTable } from '../components/SyncStatusTable';
import logger from '../utils/logger';
import { saveLocalMappings } from '../utils/sync-api';

// Define interface for field data
interface FieldData {
  id: string;
  name: string;
  type: string;
  value: any;
  isAsset: boolean;
  assetDetails?: Array<{
    id: string;
    title: string;
    description: string;
    url: string;
    fileName: string;
    contentType: string;
  }>;
  contentTypeId?: string;
}

// Extend the FieldData type to include contentTypeId
interface ExtendedFieldData extends FieldData {
  contentTypeId?: string;
}

// Define interface for field items
interface FieldItem {
  id: string;
  name: string;
  type?: string;
}

// Update the type definition to include app property
interface CustomSDK extends PageExtensionSDK {
  app?: {
    getParameters: () => Promise<any>;
    setParameters: (params: any) => Promise<void>;
    onConfigure: () => Promise<void>;
  };
}

export const FieldMappingScreen: React.FC = () => {
  const sdk = useSDK<CustomSDK>();
  const [mappings, setMappings] = useState<ExtendedFieldData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contentTypes, setContentTypes] = useState<Record<string, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableContentTypes, setAvailableContentTypes] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedContentType, setSelectedContentType] = useState<string>('');
  const [availableFields, setAvailableFields] = useState<FieldItem[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [entries, setEntries] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string>('');
  const [isEntriesLoading, setIsEntriesLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isSyncSuccess, setIsSyncSuccess] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // First check localStorage directly to ensure we have the most current data
        const localStorageData = localStorage.getItem('klaviyo_field_mappings');
        let mappingsFromStorage = [];

        if (localStorageData) {
          try {
            mappingsFromStorage = JSON.parse(localStorageData);
            logger.log(
              '[FieldMappingScreen] Loaded mappings directly from localStorage:',
              mappingsFromStorage
            );

            if (Array.isArray(mappingsFromStorage) && mappingsFromStorage.length > 0) {
              setMappings(mappingsFromStorage);
            }
          } catch (parseError) {
            logger.error('[FieldMappingScreen] Error parsing localStorage data:', parseError);
          }
        }

        // As a backup, also try the persistence service
        if (!mappingsFromStorage.length) {
          const savedMappings = await getSyncData(sdk);
          logger.log(
            '[FieldMappingScreen] Loaded mappings from persistence service:',
            savedMappings
          );

          if (savedMappings && Array.isArray(savedMappings) && savedMappings.length > 0) {
            setMappings(savedMappings);
          } else {
            logger.log('[FieldMappingScreen] No mappings found');
          }
        }

        // Get content type names for display
        const ctNames: Record<string, string> = {};
        const contentTypesList: Array<{ id: string; name: string }> = [];

        try {
          const space = await sdk.cma.space.get({});
          const environment = await sdk.cma.environment.get({
            environmentId: sdk.ids.environment,
            spaceId: space.sys.id,
          });

          const ctResponse = await sdk.cma.contentType.getMany({
            spaceId: space.sys.id,
            environmentId: environment.sys.id,
          });

          ctResponse.items.forEach((ct) => {
            ctNames[ct.sys.id] = ct.name;
            contentTypesList.push({
              id: ct.sys.id,
              name: ct.name,
            });
          });
        } catch (ctError) {
          logger.warn('[FieldMappingScreen] Failed to load content type names:', ctError);
        }

        setContentTypes(ctNames);
        setAvailableContentTypes(contentTypesList);
      } catch (error) {
        logger.error('[FieldMappingScreen] Error loading mappings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial load
    loadData();

    // Function to handle message events
    const handleFieldMappingUpdate = (event: MessageEvent) => {
      if (event.data && event.data.type === 'updateFieldMappings') {
        logger.log(
          '[FieldMappingScreen] Received field mapping update via message:',
          event.data.fieldMappings
        );
        if (Array.isArray(event.data.fieldMappings)) {
          setMappings(event.data.fieldMappings);
        }
      }
    };

    // Function to handle storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'klaviyo_field_mappings') {
        logger.log('[FieldMappingScreen] Storage changed in another tab/window');
        loadData(); // Reload completely to ensure fresh data
      }
    };

    // Add all event listeners
    window.addEventListener('message', handleFieldMappingUpdate);
    window.addEventListener('storage', handleStorageChange);

    // Clean up on unmount
    return () => {
      window.removeEventListener('message', handleFieldMappingUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Load fields when content type is selected
  useEffect(() => {
    const loadFields = async () => {
      if (!selectedContentType) {
        setAvailableFields([]);
        setSelectedFields([]);
        return;
      }

      try {
        const space = await sdk.cma.space.get({});
        const contentType = await sdk.cma.contentType.get({
          spaceId: space.sys.id,
          environmentId: sdk.ids.environment,
          contentTypeId: selectedContentType,
        });

        const fields = contentType.fields.map((field) => ({
          id: field.id,
          name: field.name,
          type: field.type, // Include the field type
        }));

        setAvailableFields(fields);
        logger.log(`Loaded fields for content type ${selectedContentType}:`, fields);

        // Get existing mappings for this content type
        const existingMappingsByField = mappings
          .filter((m) => m.contentTypeId === selectedContentType)
          .reduce((acc, mapping) => {
            acc[mapping.id] = mapping;
            return acc;
          }, {} as Record<string, ExtendedFieldData>);

        // Pre-select already mapped fields
        if (Object.keys(existingMappingsByField).length > 0) {
          setSelectedFields(Object.keys(existingMappingsByField));
          logger.log(`Preselected ${Object.keys(existingMappingsByField).length} mapped fields`);
        } else {
          setSelectedFields([]);
          logger.log('No existing mappings found for content type');
        }
      } catch (error) {
        logger.error('Error loading fields:', error);
        setAvailableFields([]);
        setSelectedFields([]);
      }
    };

    loadFields();
  }, [selectedContentType, mappings]);

  // Fetch entries when content type is selected
  useEffect(() => {
    const fetchEntries = async () => {
      setEntries([]);
      setSelectedEntryId('');
      if (!selectedContentType) return;
      setIsEntriesLoading(true);
      try {
        const space = await sdk.cma.space.get({});
        const environment = await sdk.cma.environment.get({
          environmentId: sdk.ids.environment,
          spaceId: space.sys.id,
        });
        const entriesResponse = await sdk.cma.entry.getMany({
          spaceId: space.sys.id,
          environmentId: environment.sys.id,
          query: {
            content_type: selectedContentType,
            limit: 100,
          },
        });
        setEntries(
          entriesResponse.items.map((entry: any) => ({
            id: entry.sys.id,
            title:
              entry.fields?.title?.['en-US'] ||
              entry.fields?.name?.['en-US'] ||
              entry.fields?.heading?.['en-US'] ||
              entry.sys.id,
          }))
        );
      } catch (error) {
        setEntries([]);
        setSyncMessage('Error loading entries for this content type');
      } finally {
        setIsEntriesLoading(false);
      }
    };
    fetchEntries();
  }, [selectedContentType, sdk]);

  const refreshMappings = async () => {
    setIsLoading(true);
    try {
      const savedMappings = await getSyncData(sdk);
      setMappings(savedMappings || []);
    } finally {
      setIsLoading(false);
    }
  };

  const openConfigModal = () => {
    setIsModalOpen(true);
  };

  const closeConfigModal = () => {
    setIsModalOpen(false);
    // Reset state when closing
    setSelectedContentType('');
    setSelectedFields([]);
    setSyncMessage('');
  };

  const saveFieldMappings = async (mappings: any[]) => {
    try {
      setIsSaving(true);
      setSaveMessage('');

      // Format the mappings for storage
      const formattedMappings = mappings.map((fieldId) => {
        const field = availableFields.find((f) => f.id === fieldId);
        const fieldType = field?.type || 'Symbol';

        // Properly identify field types
        let mappingFieldType = 'text';
        if (fieldType === 'RichText') {
          mappingFieldType = 'richText';
        } else if (fieldType === 'Asset' || fieldType === 'Link') {
          mappingFieldType = 'image';
        } else if (fieldType === 'Array') {
          mappingFieldType = 'reference-array';
        } else if (fieldType === 'Object' || fieldType === 'ObjectMap') {
          mappingFieldType = 'json';
        } else if (fieldType === 'Location') {
          mappingFieldType = 'location';
        }

        return {
          id: fieldId,
          contentfulFieldId: fieldId,
          name: field?.name || fieldId,
          klaviyoBlockName: field?.name || fieldId,
          type: fieldType,
          fieldType: mappingFieldType,
          contentTypeId: selectedContentType,
          isAsset: fieldType === 'Asset' || fieldType === 'Link',
        };
      });

      logger.log('Saving field mappings:', formattedMappings);

      // Save to local storage first (this always works)
      try {
        // Save the mappings to local storage
        const currentMappings = getLocalMappings();

        // Remove existing mappings for this content type
        const filteredMappings = currentMappings.filter(
          (m: any) => m.contentTypeId !== selectedContentType
        );

        // Add new mappings
        const updatedMappings = [...filteredMappings, ...formattedMappings];

        // Save to local storage
        saveLocalMappings(updatedMappings);

        // Update the UI state (convert to the expected format for state)
        const mappingsForState = updatedMappings.map((m: any) => ({
          id: m.id,
          name: m.name || m.id,
          type: m.type || 'Symbol',
          value: '',
          isAsset: false,
          contentTypeId: m.contentTypeId,
        }));

        // Make sure we're setting a proper array of objects for React rendering
        setMappings(Array.isArray(mappingsForState) ? mappingsForState : []);

        logger.log('Saved mappings to local storage successfully');
      } catch (localStorageError) {
        logger.error('Error saving to local storage:', localStorageError);
      }

      // Try to save to Contentful if possible
      try {
        // We'll use the SDK's CMA client with raw HTTP requests
        const client = sdk.cma;
        const spaceId = sdk.ids.space;
        const environmentId = sdk.ids.environment;
        const appDefinitionId = sdk.ids.app;

        const currentParams = (sdk.parameters as any) || ({} as any);
        // Now update the parameters
        // Initialize content type mappings if they don't exist
        if (!currentParams.contentTypeMappings) {
          currentParams.contentTypeMappings = {};
        }

        // Add the mappings for this content type
        currentParams.contentTypeMappings[selectedContentType] = formattedMappings;

        // Also update the flat fieldMappings array
        let allMappings: any[] = [];
        Object.keys(currentParams.contentTypeMappings).forEach((typeId) => {
          const typeMappings = currentParams.contentTypeMappings[typeId];
          if (Array.isArray(typeMappings)) {
            allMappings = [...allMappings, ...typeMappings];
          }
        });

        currentParams.fieldMappings = allMappings;

        // Update the selected content types
        if (!currentParams.selectedContentTypes) {
          currentParams.selectedContentTypes = {};
        }
        currentParams.selectedContentTypes[selectedContentType] = true;

        logger.log('Saved mappings to Contentful API successfully');
        setSaveMessage('Field mappings saved successfully!');
      } catch (apiError) {
        logger.error('Error saving to Contentful API:', apiError);
        // We still saved to local storage, so it's not a complete failure
        setSaveMessage('Mappings saved locally, but could not save to Contentful API');
      }
    } catch (error) {
      logger.error('Error in saveFieldMappings:', error);
      setSaveMessage(`Error saving: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Add this helper function for processing localized fields
  const processLocalizedFields = (entryData: any): any => {
    if (!entryData) return {};

    const processedData: any = {};

    // Process each field to handle localized content
    for (const fieldId in entryData) {
      if (!entryData.hasOwnProperty(fieldId)) continue;

      const fieldValue = entryData[fieldId];
      const field = availableFields.find((f) => f.id === fieldId);
      const fieldType = field?.type || 'Symbol';

      // Handle location fields specially to ensure both coordinates are preserved
      if (
        fieldType === 'Location' &&
        fieldValue &&
        typeof fieldValue === 'object' &&
        !Array.isArray(fieldValue)
      ) {
        // Format location as a comma-separated string of coordinates
        if (fieldValue.lat !== undefined && fieldValue.lon !== undefined) {
          processedData[fieldId] = `${fieldValue.lat},${fieldValue.lon}`;
          logger.log(
            `Formatted location field ${fieldId} as coordinate string: ${processedData[fieldId]}`
          );
          continue;
        }
      }

      // Process localized fields with format {\"en-US\": \"value\"}
      if (fieldValue && typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
        // Check if it's a localized field with standard structure
        if (fieldValue['en-US'] !== undefined) {
          // Extract the value from the en-US locale
          processedData[fieldId] = fieldValue['en-US'];
          logger.log(`Extracted text from localized field ${fieldId}:`, processedData[fieldId]);
          continue;
        }

        // If it's an object with a single locale key
        const keys = Object.keys(fieldValue);
        if (keys.length === 1 && typeof fieldValue[keys[0]] !== 'object') {
          processedData[fieldId] = fieldValue[keys[0]];
          logger.log(`Extracted text from single-locale field ${fieldId}:`, processedData[fieldId]);
          continue;
        }

        // For complex objects, preserve them properly using JSON.stringify
        // This prevents [object Object] when sending to the backend
        processedData[fieldId] = JSON.stringify(fieldValue);
        logger.log(`Preserved JSON object for field ${fieldId}`);
        continue;
      }

      // Keep other values as-is
      processedData[fieldId] = fieldValue;
    }

    return processedData;
  };

  // Update the handleSyncToKlaviyo function to use the new processing function
  const handleSyncToKlaviyo = async () => {
    if (!selectedContentType) {
      setSyncMessage('Please select a content type');
      return;
    }
    if (!selectedEntryId) {
      setSyncMessage('Please select an entry');
      return;
    }
    if (selectedFields.length === 0) {
      setSyncMessage('Please select at least one field');
      return;
    }

    setIsSyncing(true);
    setSyncMessage('Syncing to Klaviyo...');
    try {
      // First, save the field mappings
      await saveFieldMappings(selectedFields);
      logger.log('Field mappings saved, now syncing content');

      // Fetch the entry data
      const space = await sdk.cma.space.get({});
      const environment = await sdk.cma.environment.get({
        spaceId: space.sys.id,
        environmentId: sdk.ids.environment,
      });
      const entry = await sdk.cma.entry.get({
        spaceId: space.sys.id,
        environmentId: sdk.ids.environment,
        entryId: selectedEntryId as string,
      });

      // Extract field values
      const entryData: Record<string, any> = {};

      // Process each field in the entry
      if (entry && entry.fields) {
        for (const fieldId in entry.fields) {
          if (selectedFields.includes(fieldId)) {
            // Get the raw value from entry fields
            const rawValue = entry.fields[fieldId];
            const field = availableFields.find((f) => f.id === fieldId);
            const fieldType = field?.type || 'Symbol';

            // Handle location fields specially
            if (fieldType === 'Location' && typeof rawValue === 'object' && rawValue !== null) {
              if (rawValue['en-US'] && typeof rawValue['en-US'] === 'object') {
                const locationObj = rawValue['en-US'];
                if (locationObj.lat !== undefined && locationObj.lon !== undefined) {
                  entryData[fieldId] = `${locationObj.lat},${locationObj.lon}`;
                  logger.log(
                    `Formatted location field ${fieldId} as coordinate string: ${entryData[fieldId]}`
                  );
                  continue;
                }
              }
            }

            // For complex objects, stringify them to preserve all data
            if (typeof rawValue === 'object' && rawValue !== null) {
              // For complex objects, JSON stringify them to preserve the data
              logger.log(`Processing complex object field ${fieldId}`);
              entryData[fieldId] = rawValue;
            } else {
              entryData[fieldId] = rawValue;
            }
          }
        }
      }

      // Process any localized fields to extract their values
      const processedEntryData = processLocalizedFields(entryData);

      logger.log('Processed entry data for sync:', processedEntryData);

      // Get all local mappings that match our content type
      const allLocalMappings = getLocalMappings();
      logger.log(
        'All local mappings:',
        allLocalMappings,
        'Selected content type:',
        selectedContentType
      );

      const contentTypeMappings = allLocalMappings.filter(
        (mapping) => mapping.contentTypeId === selectedContentType
      );
      logger.log('Mappings after contentTypeId filter:', contentTypeMappings);

      if (contentTypeMappings.length === 0) {
        logger.log('No existing mappings found for content type', selectedContentType);

        // Preselect the fields based on the current selection
        logger.log('Preselected', selectedFields.length, 'mapped fields');

        // Create new mappings from selected fields
        const newMappings = selectedFields.map((fieldId) => {
          const field = availableFields.find((f) => f.id === fieldId);
          const fieldType = field?.type || 'Symbol';

          // Determine proper field type based on Contentful field type
          let mappingFieldType = 'text';
          if (fieldType === 'RichText') {
            mappingFieldType = 'richText';
          } else if (fieldType === 'Asset' || fieldType === 'Link') {
            mappingFieldType = 'image';
          } else if (fieldType === 'Object' || fieldType === 'Array') {
            mappingFieldType = 'json';
          } else if (fieldType === 'Location') {
            mappingFieldType = 'location';
          }

          return {
            id: fieldId,
            contentfulFieldId: fieldId,
            name: field?.name || fieldId,
            klaviyoBlockName: field?.name || fieldId,
            type: fieldType,
            fieldType: mappingFieldType,
            contentTypeId: selectedContentType,
            isAsset: false,
            value: processedEntryData[fieldId],
          };
        });
        logger.log('Created new mappings from selected fields:', newMappings);
        contentTypeMappings.push(...newMappings);
      }

      // Prepare mappings in the format expected by SyncContent
      const syncMappings = contentTypeMappings.map((mapping: any) => ({
        contentfulFieldId: mapping.contentfulFieldId || mapping.id,
        klaviyoBlockName: mapping.klaviyoBlockName || mapping.name || mapping.id,
        fieldType:
          mapping.fieldType ||
          (mapping.type === 'RichText' ? 'richText' : mapping.type === 'Object' ? 'json' : 'text'),
      }));

      // Initialize SyncContent with the current entry
      const syncContent = new SyncContent(processedEntryData, sdk);

      // Attempt to sync content
      const result = await syncContent.syncContent(sdk, syncMappings, {
        entryId: selectedEntryId,
        contentTypeId: selectedContentType,
      });

      setIsSyncing(false);

      if (result && result.success) {
        setIsSyncSuccess(true);
        setSyncMessage('Content synced successfully to Klaviyo!');
      } else {
        setIsSyncSuccess(false);
        setSyncMessage(`Error syncing content: ${result?.error || 'Unknown error'}`);
      }
    } catch (error) {
      setIsSyncing(false);
      setIsSyncSuccess(false);
      setSyncMessage(
        `Error syncing content: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error('Error syncing content:', error);
    }
  };

  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]
    );
  };

  return (
    <Box padding="spacingL" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <Stack spacing="spacingL" flexDirection="column">
        <Heading>Klaviyo Field Mappings</Heading>

        <Paragraph>Manage field mappings and sync status for Klaviyo integration.</Paragraph>

        <Box>
          <Tabs defaultTab="mappingsPanel">
            <Tabs.List>
              <Tabs.Tab panelId="mappingsPanel">Field Mappings</Tabs.Tab>
              <Tabs.Tab panelId="syncStatusPanel">Sync Status</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel id="mappingsPanel" style={{ paddingTop: '20px' }}>
              <Flex justifyContent="flex-start">
                <Button
                  variant="positive"
                  onClick={openConfigModal}
                  style={{ marginBottom: '16px' }}>
                  Configure Field Mappings
                </Button>
              </Flex>

              {isLoading ? (
                <Text>Loading mappings...</Text>
              ) : mappings.length > 0 ? (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Field Name</TableCell>
                      <TableCell>Field Type</TableCell>
                      <TableCell>Content Type</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mappings.map((mapping, index) => (
                      <TableRow key={`${mapping.id}-${index}`}>
                        <TableCell>{String(mapping.name || mapping.id || '')}</TableCell>
                        <TableCell>{mapping.isAsset ? 'Image' : 'Text'}</TableCell>
                        <TableCell>
                          {mapping.contentTypeId
                            ? contentTypes[mapping.contentTypeId] || String(mapping.contentTypeId)
                            : 'Unknown'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Note variant="warning">
                  No field mappings found. Click "Configure Field Mappings" to set up field
                  mappings.
                </Note>
              )}

              <Box marginTop="spacingL">
                <Heading as="h2">How to add field mappings</Heading>
                <Paragraph>1. Click "Configure Field Mappings" above</Paragraph>
                <Paragraph>2. Select a content type and the fields you want to map</Paragraph>
                <Paragraph>
                  3. Click "Save Mappings" to save your configuration for future use
                </Paragraph>
                <Paragraph>
                  4. Select an entry and click "Sync to Klaviyo" to send the data directly to
                  Klaviyo (this will also save your mappings)
                </Paragraph>
              </Box>
            </Tabs.Panel>
            <Tabs.Panel id="syncStatusPanel">
              <SyncStatusTable sdk={sdk} onRefresh={refreshMappings} />
            </Tabs.Panel>
          </Tabs>
        </Box>
      </Stack>

      {/* Field Mapping Configuration Modal */}
      <Modal isShown={isModalOpen} onClose={closeConfigModal} size="large">
        {() => (
          <>
            <Modal.Header title="Configure Field Mappings" onClose={closeConfigModal} />
            <Modal.Content>
              <Stack
                spacing="spacingM"
                alignItems="flex-start"
                flexDirection="column"
                style={{ width: '100%' }}>
                <FormControl style={{ width: '100%' }}>
                  <FormControl.Label>Select Content Type</FormControl.Label>
                  <Select
                    style={{ width: '100%' }}
                    onChange={(e) => setSelectedContentType(e.target.value)}
                    value={selectedContentType}>
                    <Select.Option value="">-- Select a content type --</Select.Option>
                    {availableContentTypes.map((ct) => (
                      <Select.Option key={ct.id} value={ct.id}>
                        {ct.name}
                      </Select.Option>
                    ))}
                  </Select>
                </FormControl>
                {selectedContentType && (
                  <FormControl style={{ width: '100%' }}>
                    <FormControl.Label>Select Entry</FormControl.Label>
                    {isEntriesLoading ? (
                      <Spinner size="small" />
                    ) : entries.length > 0 ? (
                      <Select
                        style={{ width: '100%' }}
                        onChange={(e) => setSelectedEntryId(e.target.value)}
                        value={selectedEntryId}>
                        <Select.Option value="">-- Select an entry --</Select.Option>
                        {entries.map((entry) => (
                          <Select.Option key={entry.id} value={entry.id}>
                            {entry.title}
                          </Select.Option>
                        ))}
                      </Select>
                    ) : (
                      <Text fontColor="gray500">No entries found for this content type.</Text>
                    )}
                  </FormControl>
                )}

                <Box style={{ width: '100%' }}>
                  <Text fontWeight="fontWeightMedium" style={{ width: '100%' }}>
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
                      maxHeight: '200px',
                      overflow: 'auto',
                      border: '1px solid #EEEEEE',
                      borderRadius: '4px',
                      padding: '8px',
                    }}>
                    {availableFields.length > 0 ? (
                      // Filter fields based on search query and exclude already selected fields
                      availableFields
                        .filter(
                          (field) =>
                            !selectedFields.includes(field.id) &&
                            (searchQuery === '' ||
                              field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              field.id.toLowerCase().includes(searchQuery.toLowerCase()))
                        )
                        .map((field) => (
                          <Box
                            key={field.id}
                            padding="spacingXs"
                            onClick={() => handleFieldToggle(field.id)}
                            onMouseEnter={() => setHoveredField(field.id)}
                            onMouseLeave={() => setHoveredField(null)}
                            style={{
                              cursor: 'pointer',
                              borderBottom: '1px solid #EEEEEE',
                              backgroundColor:
                                hoveredField === field.id ? '#F7F9FA' : 'transparent',
                            }}>
                            <Text>{field.name}</Text>
                            <Text fontColor="gray500" fontSize="fontSizeS">
                              ({field.type || 'Text'})
                            </Text>
                          </Box>
                        ))
                    ) : (
                      <Text fontColor="gray500" style={{ textAlign: 'center', padding: '16px' }}>
                        No fields available for this content type
                      </Text>
                    )}
                  </Box>
                </Box>

                {selectedFields.length > 0 && (
                  <Box>
                    <Subheading marginBottom="spacingS">Selected Fields</Subheading>
                    <Flex flexWrap="wrap" gap="spacingXs">
                      {selectedFields.map((fieldId) => {
                        const field = availableFields.find((f) => f.id === fieldId);
                        if (!field) return null;

                        return (
                          <Pill
                            key={field.id}
                            label={`${field.name} (${field.type || 'Text'})`}
                            onClose={() => handleFieldToggle(field.id)}
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
              </Stack>
            </Modal.Content>
            <Modal.Controls
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
              }}>
              <Button variant="secondary" onClick={closeConfigModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => saveFieldMappings(selectedFields)}
                isDisabled={!selectedContentType || selectedFields.length === 0}
                isLoading={isSaving}
                style={{ marginLeft: '10px' }}>
                Save Mappings
              </Button>
              <Button
                variant="primary"
                onClick={handleSyncToKlaviyo}
                isDisabled={!selectedContentType || !selectedEntryId || selectedFields.length === 0}
                isLoading={isSyncing}
                style={{ marginLeft: '10px' }}>
                Save & Sync to Klaviyo
              </Button>
            </Modal.Controls>
          </>
        )}
      </Modal>
    </Box>
  );
};

export default FieldMappingScreen;
