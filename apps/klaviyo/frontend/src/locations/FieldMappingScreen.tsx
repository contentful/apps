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
import { getSyncData, updateSyncData } from '../utils/persistence-service';
import { FieldData, SyncContent } from '../utils/klaviyo-api-service';
import { SyncStatusTable } from '../components/SyncStatusTable';
import logger from '../utils/logger';

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

export const FieldMappingScreen: React.FC = () => {
  const sdk = useSDK<PageExtensionSDK>();
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
      if (!selectedContentType) return;

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

        // Pre-select already mapped fields
        const existingMappings = mappings.filter((m) => m.contentTypeId === selectedContentType);
        setSelectedFields(existingMappings.map((m) => m.id));
      } catch (error) {
        logger.error('Error loading fields:', error);
        setAvailableFields([]);
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

  const handleSaveMapping = async () => {
    if (!selectedContentType) {
      setSyncMessage('Please select a content type');
      return;
    }

    if (selectedFields.length === 0) {
      setSyncMessage('Please select at least one field');
      return;
    }

    try {
      // Get existing fields for other content types
      const existingMappings = mappings.filter((m) => m.contentTypeId !== selectedContentType);

      // Generate new mappings for selected content type with the required properties
      const newMappings = selectedFields.map((fieldId) => {
        const field = availableFields.find((f) => f.id === fieldId);
        return {
          id: fieldId,
          name: field?.name || fieldId,
          contentTypeId: selectedContentType,
          isAsset: false, // Default to non-asset
          type: 'Text', // Add required field
          value: '', // Add required field
        };
      });

      // Combine and save
      const updatedMappings = [...existingMappings, ...newMappings];
      await updateSyncData(updatedMappings);

      // Update local state
      setMappings(updatedMappings);

      // Notify any other components
      window.postMessage(
        {
          type: 'updateFieldMappings',
          fieldMappings: updatedMappings,
        },
        '*'
      );

      setSyncMessage('Mappings saved successfully');
    } catch (error) {
      logger.error('Error saving mappings:', error);
      setSyncMessage('Error saving mappings');
    }
  };

  const handleSyncToKlaviyo = async () => {
    if (!selectedContentType) {
      setSyncMessage('Please select a content type');
      return;
    }
    if (!selectedEntryId) {
      setSyncMessage('Please select an entry');
      return;
    }
    setIsSyncing(true);
    setSyncMessage('Syncing to Klaviyo...');
    try {
      // Fetch the entry data
      const space = await sdk.cma.space.get({});
      const environment = await sdk.cma.environment.get({
        environmentId: sdk.ids.environment,
        spaceId: space.sys.id,
      });
      const entry = await sdk.cma.entry.get({
        spaceId: space.sys.id,
        environmentId: environment.sys.id,
        entryId: selectedEntryId,
      });
      // Prepare mappings
      const formattedMappings = selectedFields.map((fieldId) => {
        const field = availableFields.find((f) => f.id === fieldId);
        return {
          contentfulFieldId: fieldId,
          klaviyoBlockName: field?.name || fieldId,
          fieldType: 'text',
        };
      });
      // Call real sync
      const syncContentService = new SyncContent(entry);
      await syncContentService.syncContent(
        {
          ...sdk,
          entry,
        },
        formattedMappings
      );
      setSyncMessage('Content successfully synced to Klaviyo!');
    } catch (error: any) {
      logger.error('Error syncing:', error);
      setSyncMessage(`Error syncing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
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
                        <TableCell>{mapping.name}</TableCell>
                        <TableCell>{mapping.isAsset ? 'Image' : 'Text'}</TableCell>
                        <TableCell>
                          {mapping.contentTypeId
                            ? contentTypes[mapping.contentTypeId] || mapping.contentTypeId
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
                <Paragraph>3. Click "Save Mappings" to save your configuration</Paragraph>
                <Paragraph>
                  4. Click "Sync to Klaviyo" to send the data directly to Klaviyo
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
                variant="positive"
                onClick={handleSaveMapping}
                isDisabled={!selectedContentType || selectedFields.length === 0}
                style={{ marginRight: '10px' }}>
                Save Mappings
              </Button>
              <Button
                variant="primary"
                onClick={handleSyncToKlaviyo}
                isDisabled={!selectedContentType || selectedFields.length === 0}
                isLoading={isSyncing}>
                Sync to Klaviyo
              </Button>
            </Modal.Controls>
          </>
        )}
      </Modal>
    </Box>
  );
};

export default FieldMappingScreen;
