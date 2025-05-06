import React, { useEffect, useState } from 'react';
import { PageExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
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
  Badge,
  Checkbox,
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

// Extend the FieldData type to include contentTypeId and status
interface ExtendedFieldData extends FieldData {
  contentTypeId?: string;
  status?: string;
  fields?: Array<{ id: string; name: string }>;
  klaviyoBlockName?: string;
  updated?: string;
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
  const [selectedEntry, setSelectedEntry] = useState<ExtendedFieldData | null>(null);
  const [isFieldsModalOpen, setIsFieldsModalOpen] = useState(false);
  const [checkedFields, setCheckedFields] = useState<string[]>([]);
  const [selectedEntryGroup, setSelectedEntryGroup] = useState<ExtendedFieldData[] | null>(null);
  const [modalAvailableFields, setModalAvailableFields] = useState<FieldItem[]>([]);

  // Group mappings by contentTypeId (or another unique entry identifier)
  const groupedMappings: Record<string, ExtendedFieldData[]> = React.useMemo(() => {
    return mappings.reduce((acc, mapping) => {
      const key = mapping.contentTypeId || mapping.id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(mapping);
      return acc;
    }, {} as Record<string, ExtendedFieldData[]>);
  }, [mappings]);

  // Helper to get entry name for a group
  const getEntryName = (fields: ExtendedFieldData[]) => {
    // Use the first mapping's name as the entry name
    return fields[0]?.name || fields[0]?.klaviyoBlockName || fields[0]?.id || 'Unknown';
  };

  // Helper to get content type for a group
  const getContentType = (fields: ExtendedFieldData[]) => {
    return fields[0]?.contentTypeId
      ? contentTypes[fields[0].contentTypeId] || fields[0].contentTypeId
      : 'Unknown';
  };

  // Helper to get updated time for a group (stubbed)
  const getUpdatedTimeGroup = (fields: ExtendedFieldData[]) => {
    return fields[0]?.updated || 'Just now';
  };

  // Helper to get status for a group (stubbed)
  const getStatusGroup = (fields: ExtendedFieldData[]) => {
    return fields[0]?.status;
  };

  // Helper to get connected fields list for modal
  const getConnectedFieldsList = (fields: ExtendedFieldData[]) => {
    return fields.map((f) => f.name || f.klaviyoBlockName || f.id);
  };

  // Handle checkbox logic
  const handleFieldCheckbox = (field: string) => {
    setCheckedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };
  const allFields = selectedEntryGroup ? getConnectedFieldsList(selectedEntryGroup) : [];
  const allChecked = allFields.length > 0 && checkedFields.length === allFields.length;
  const handleHeaderCheckbox = () => {
    const allIds = modalAvailableFields.map((f) => f.id);
    if (allIds.length > 0 && checkedFields.length === allIds.length) {
      setCheckedFields([]);
    } else {
      setCheckedFields(allIds);
    }
  };

  // Reset checked fields when modal opens/closes or entry changes
  React.useEffect(() => {
    setCheckedFields([]);
  }, [isFieldsModalOpen, selectedEntryGroup]);

  // Count of grouped entries
  const groupedEntries = Object.values(groupedMappings);
  const connectedCount = groupedEntries.length;
  const maxCount = 25;

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

  const saveFieldMappings = async (mappings: any[], fieldsSource?: FieldItem[]) => {
    try {
      setIsSaving(true);
      setSaveMessage('');

      // Format the mappings for storage
      const fieldsArr = fieldsSource || availableFields;
      const formattedMappings = mappings.map((fieldId) => {
        const field = fieldsArr.find((f) => f.id === fieldId);
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

        // Add new mappings and deduplicate by contentTypeId and id
        const combinedMappings = [...filteredMappings, ...formattedMappings];
        const uniqueMap = new Map();
        combinedMappings.forEach((m) => {
          // Use both contentTypeId and id as the unique key
          const key = `${m.contentTypeId || ''}:${m.id}`;
          uniqueMap.set(key, m);
        });
        const updatedMappings = Array.from(uniqueMap.values());
        console.log(
          'updatedMappings',
          updatedMappings,
          filteredMappings,
          formattedMappings,
          selectedContentType
        );

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

  // Helper to get status pill
  const getStatusPill = (status?: string) => {
    if (status === 'Published') {
      return <Badge variant="positive">Published</Badge>;
    }
    return <Badge variant="warning">Draft</Badge>;
  };

  // When opening the modal, set checkedFields to mapped field IDs
  const openFieldsModal = async (fields: ExtendedFieldData[]) => {
    setSelectedEntryGroup(fields);
    // Set selectedContentType to the contentTypeId of the entry group
    if (fields[0]?.contentTypeId) {
      setSelectedContentType(fields[0].contentTypeId);
    }
    setIsFieldsModalOpen(true);
    const contentTypeId = fields[0]?.contentTypeId;
    let allFields: FieldItem[] = [];
    if (contentTypeId) {
      // Fetch fields for this contentTypeId using the SDK
      const space = await sdk.cma.space.get({});
      const contentType = await sdk.cma.contentType.get({
        spaceId: space.sys.id,
        environmentId: sdk.ids.environment,
        contentTypeId,
      });
      allFields = contentType.fields.map((field: any) => ({
        id: field.id,
        name: field.name,
        type: field.type,
      }));
    }
    setModalAvailableFields(allFields);
    // Set checkedFields to mapped field IDs
    const mappedFieldIds = fields.map((f) => f.id);
    setCheckedFields(mappedFieldIds);
  };

  const handleFieldsModalClose = async () => {
    // Save the checked fields as the new mappings for this entry group/content type
    if (selectedEntryGroup && checkedFields) {
      // Save only for the current entry group/content type
      await saveFieldMappings(checkedFields, modalAvailableFields);
    }
    setIsFieldsModalOpen(false);
  };

  return (
    <Box padding="spacingL" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingL">
        <Box>
          <Heading as="h1" marginBottom="spacingXs">
            Klaviyo Universal Content
          </Heading>
          <Text fontColor="gray700" fontSize="fontSizeL">
            Content connected to Klaviyo through Universal Content
          </Text>
        </Box>
        <Text fontColor="gray700" fontSize="fontSizeL">
          Connected entries: {connectedCount}/{maxCount}
        </Text>
      </Flex>
      <Box>
        {groupedEntries.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Entry name</TableCell>
                <TableCell>Content type</TableCell>
                <TableCell>Connected fields</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groupedEntries.map((fields, idx) => (
                <TableRow
                  key={fields[0]?.id || idx}
                  style={{ cursor: 'pointer' }}
                  onClick={async () => await openFieldsModal(fields)}>
                  <TableCell>{getEntryName(fields)}</TableCell>
                  <TableCell>{getContentType(fields)}</TableCell>
                  <TableCell>{fields.length}</TableCell>
                  <TableCell>{getUpdatedTimeGroup(fields)}</TableCell>
                  <TableCell>{getStatusPill(getStatusGroup(fields))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Note variant="warning">No entries with field mappings found.</Note>
        )}
      </Box>

      {/* Connected Fields Modal */}
      <Modal isShown={isFieldsModalOpen} onClose={handleFieldsModalClose} size="medium">
        {() => (
          <>
            <Modal.Header title="Connected fields" onClose={handleFieldsModalClose} />
            <Modal.Content>
              {selectedEntryGroup && (
                <Box padding="spacingL">
                  <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingL">
                    <Flex alignItems="center" gap="spacingM">
                      <Box>
                        <Stack flexDirection="column" alignItems="flex-start">
                          <Text>Entry name</Text>
                          <Text as="span" fontWeight="fontWeightMedium">
                            {getEntryName(selectedEntryGroup)}
                          </Text>
                        </Stack>
                      </Box>
                      <Box>
                        <Stack flexDirection="column" alignItems="flex-start">
                          <Text>Connected fields</Text>
                          <Text as="span" fontWeight="fontWeightMedium">
                            {selectedEntryGroup.length}
                          </Text>
                        </Stack>
                      </Box>
                    </Flex>
                    <Button variant="secondary" size="small" style={{ height: 32 }}>
                      View entry
                    </Button>
                  </Flex>
                  <Box
                    style={{
                      background: '#fff',
                      borderRadius: 8,
                      border: '1px solid #E5E5E5',
                      padding: 0,
                      marginTop: 16,
                    }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell style={{ width: 40, fontWeight: 700 }}>
                            <Checkbox
                              isChecked={
                                modalAvailableFields.length > 0 &&
                                checkedFields.length === modalAvailableFields.length
                              }
                              onChange={handleHeaderCheckbox}>
                              Field name
                            </Checkbox>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {modalAvailableFields.map((field, idx) => (
                          <TableRow key={field.id + idx}>
                            <TableCell>
                              <Checkbox
                                isChecked={checkedFields.includes(field.id)}
                                onChange={() => handleFieldCheckbox(field.id)}>
                                {field.name || field.id}
                              </Checkbox>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Box>
              )}
            </Modal.Content>
            <Modal.Controls>
              <Button
                variant="secondary"
                style={{ minWidth: 100 }}
                onClick={handleFieldsModalClose}>
                Close
              </Button>
            </Modal.Controls>
          </>
        )}
      </Modal>
    </Box>
  );
};

export default FieldMappingScreen;
