import React, { useEffect, useState, useRef } from 'react';
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
import {
  getEntryKlaviyoFieldMappings,
  setEntryKlaviyoFieldMappings,
} from '../utils/field-mappings';

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
  const [entries, setEntries] = useState<
    Array<{ id: string; title: string; contentTypeId: string }>
  >([]);
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
  const [allEntryMappings, setAllEntryMappings] = useState<
    { entryId: string; title: string; contentTypeId: string; mappings: any[] }[]
  >([]);
  const [modalEntryId, setModalEntryId] = useState<string | null>(null);
  const [modalContentTypeId, setModalContentTypeId] = useState<string | null>(null);
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

        // Only load mappings if an entry is selected
        if (selectedEntryId) {
          const entryMappings = await getEntryKlaviyoFieldMappings(sdk, selectedEntryId);
          logger.log('[FieldMappingScreen] Loaded mappings from entry:', entryMappings);
          setMappings(entryMappings);
        } else {
          setMappings([]);
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

    loadData();

    // No localStorage or message event listeners needed
    // Clean up on unmount: nothing to clean
  }, [selectedEntryId, sdk]);

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
    const fetchAllEntries = async () => {
      setEntries([]);
      setSelectedEntryId('');
      setIsEntriesLoading(true);
      try {
        const space = await sdk.cma.space.get({});
        const environment = await sdk.cma.environment.get({
          environmentId: sdk.ids.environment,
          spaceId: space.sys.id,
        });
        logger.log('Fetching ALL entries in env:', environment.sys.id);
        // Fetch all entries (up to 1000 for now)
        const entriesResponse = await sdk.cma.entry.getMany({
          spaceId: space.sys.id,
          environmentId: environment.sys.id,
          query: {
            limit: 1000,
          },
        });
        logger.log('All entries response:', entriesResponse.items);
        setEntries(
          entriesResponse.items.map((entry: any) => ({
            id: entry.sys.id,
            title:
              entry.fields?.title?.['en-US'] ||
              entry.fields?.name?.['en-US'] ||
              entry.fields?.heading?.['en-US'] ||
              entry.sys.id,
            contentTypeId: entry.sys.contentType?.sys?.id || 'unknown',
          }))
        );
      } catch (error) {
        logger.error('Error loading all entries:', error);
        setEntries([]);
        setSyncMessage('Error loading entries');
      } finally {
        setIsEntriesLoading(false);
      }
    };
    fetchAllEntries();
  }, [sdk]);

  // Fetch all entries for the selected content type and load their mappings
  useEffect(() => {
    const loadAllEntryMappings = async () => {
      setIsLoading(true);
      try {
        if (entries.length > 0) {
          const allMappings: {
            entryId: string;
            title: string;
            contentTypeId: string;
            mappings: any[];
          }[] = [];
          for (const entry of entries) {
            const entryMappings = await getEntryKlaviyoFieldMappings(sdk, entry.id);
            allMappings.push({
              entryId: entry.id,
              title: entry.title,
              contentTypeId: entry.contentTypeId || 'unknown',
              mappings: entryMappings || [],
            });
          }
          setAllEntryMappings(allMappings);
        } else {
          setAllEntryMappings([]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadAllEntryMappings();
  }, [entries, sdk]);

  const saveFieldMappings = async (
    mappings: any[],
    fieldsSource?: FieldItem[],
    entryIdOverride?: string
  ) => {
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
          contentTypeId: undefined, // Not used in this context
          isAsset: fieldType === 'Asset' || fieldType === 'Link',
          value: '',
        };
      });

      const entryIdToSave = entryIdOverride || selectedEntryId;
      console.log('[saveFieldMappings] entryIdToSave:', entryIdToSave);
      if (entryIdToSave) {
        await setEntryKlaviyoFieldMappings(sdk, entryIdToSave, formattedMappings);
        setMappings(formattedMappings);
        setSaveMessage('Field mappings saved to entry successfully!');
      } else {
        setSaveMessage('No entry selected.');
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
  const openFieldsModal = async (
    fields: ExtendedFieldData[],
    entryId: string,
    contentTypeId: string
  ) => {
    setSelectedEntryGroup(fields);
    setModalEntryId(entryId);
    setModalContentTypeId(contentTypeId);
    // Set selectedContentType to the contentTypeId of the entry group
    if (fields[0]?.contentTypeId) {
      setSelectedContentType(fields[0].contentTypeId);
    }
    setIsFieldsModalOpen(true);
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
    if (selectedEntryGroup && checkedFields) {
      const entryId = modalEntryId;
      const contentTypeId = modalContentTypeId;
      console.log('[handleFieldsModalClose] entryId:', entryId, 'contentTypeId:', contentTypeId);
      if (entryId && contentTypeId) {
        await saveFieldMappings(checkedFields, modalAvailableFields, entryId);
        // Fetch mappings again to verify
        const entryMappings = await getEntryKlaviyoFieldMappings(sdk, entryId);
        console.log('[handleFieldsModalClose] Fetched mappings after save:', entryMappings);
        if (!entryMappings || entryMappings.length === 0) {
          logger.error('[SyncContent] No field mappings provided for entryId:', entryId);
          setSyncMessage('No field mappings found after save. Please try again.');
        } else {
          try {
            const syncInstance = new SyncContent({ entryId, contentTypeId }, sdk);
            await syncInstance.syncContent(syncInstance.sdk, entryMappings);
            setSyncMessage('Synced with Klaviyo!');
          } catch (syncError) {
            logger.error('Error syncing with Klaviyo:', syncError);
            setSyncMessage('Error syncing with Klaviyo');
          }
        }
      } else {
        logger.error(
          '[handleFieldsModalClose] No entryId or contentTypeId found for modal:',
          selectedEntryGroup
        );
        setSyncMessage('No entryId or contentTypeId found for this entry.');
      }
    }
    setModalEntryId(null);
    setModalContentTypeId(null);
    setIsFieldsModalOpen(false);
  };

  // Dropdown close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Select all logic
  const allSelected =
    selectedContentTypes.length === availableContentTypes.length &&
    availableContentTypes.length > 0;
  const someSelected =
    selectedContentTypes.length > 0 && selectedContentTypes.length < availableContentTypes.length;
  const handleSelectAll = () => {
    if (allSelected) setSelectedContentTypes([]);
    else setSelectedContentTypes(availableContentTypes.map((ct) => ct.id));
  };
  const handleToggleContentType = (id: string) => {
    setSelectedContentTypes((prev) =>
      prev.includes(id) ? prev.filter((ct) => ct !== id) : [...prev, id]
    );
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
          Connected entries: {allEntryMappings.length}/{maxCount}
        </Text>
      </Flex>
      {/* Content type multi-select dropdown */}
      <Box
        style={{
          maxWidth: 480,
          margin: '0 auto',
          marginBottom: 40,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          padding: 32,
        }}>
        <Text
          as="h2"
          fontWeight="fontWeightDemiBold"
          fontSize="fontSizeL"
          style={{ marginBottom: 8 }}>
          Assign content types
        </Text>
        <Text fontColor="gray700" style={{ marginBottom: 18 }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.
        </Text>
        <Text fontWeight="fontWeightMedium" style={{ marginBottom: 8, display: 'block' }}>
          Content types
        </Text>
        <Box style={{ position: 'relative', width: '100%' }} ref={dropdownRef}>
          <Button
            variant="secondary"
            style={{
              width: '100%',
              justifyContent: 'space-between',
              textAlign: 'left',
              background: '#FAFAFA',
              border: '1px solid #DADADA',
              color: '#888',
              fontSize: '15px',
              borderRadius: 6,
            }}
            onClick={() => setDropdownOpen((open) => !open)}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}>
            {selectedContentTypes.length === 0
              ? 'Select content types'
              : selectedContentTypes.length === 1
              ? availableContentTypes.find((ct) => ct.id === selectedContentTypes[0])?.name
              : `${selectedContentTypes.length} selected`}
            <span style={{ float: 'right', marginLeft: 8 }}>
              <svg width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 6l4 4 4-4"
                  stroke="#888"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </Button>
          {dropdownOpen && (
            <Box
              style={{
                position: 'absolute',
                zIndex: 99999,
                top: '100%',
                left: 0,
                width: '100%',
                background: '#fff',
                border: '1px solid #DADADA',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                padding: 0,
                marginTop: 4,
                maxHeight: 320,
                overflowY: 'auto',
              }}>
              <Box style={{ padding: 12, borderBottom: '1px solid #eee' }}>
                <Checkbox
                  isChecked={allSelected}
                  isIndeterminate={someSelected}
                  onChange={handleSelectAll}
                  style={{ fontWeight: 500 }}>
                  Select all
                </Checkbox>
              </Box>
              {availableContentTypes.map((ct) => (
                <Box
                  key={ct.id}
                  style={{
                    padding: '10px 18px',
                    borderBottom: '1px solid #F0F0F0',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}>
                  <Checkbox
                    isChecked={selectedContentTypes.includes(ct.id)}
                    onChange={() => handleToggleContentType(ct.id)}
                    style={{ marginRight: 8 }}>
                    {ct.name}
                  </Checkbox>
                </Box>
              ))}
            </Box>
          )}
        </Box>
        {/* Selected count and pills */}
        {selectedContentTypes.length > 0 && (
          <>
            <Text fontColor="gray500" style={{ marginTop: 12, marginBottom: 10, fontSize: 15 }}>
              {selectedContentTypes.length} selected
            </Text>
            <Flex flexWrap="wrap" gap="spacingS" style={{ marginBottom: 0 }}>
              {selectedContentTypes.map((id) => {
                const ct = availableContentTypes.find((c) => c.id === id);
                if (!ct) return null;
                return (
                  <Flex
                    key={id}
                    alignItems="center"
                    style={{
                      background: '#e5e8eb',
                      borderRadius: 20,
                      padding: '6px 16px 6px 14px',
                      marginRight: 8,
                      marginBottom: 8,
                      fontSize: 15,
                      fontWeight: 500,
                    }}>
                    <Text style={{ marginRight: 8 }}>{ct.name}</Text>
                    <Button
                      variant="transparent"
                      size="small"
                      aria-label={`Remove ${ct.name}`}
                      onClick={() =>
                        setSelectedContentTypes((prev) => prev.filter((x) => x !== id))
                      }
                      style={{
                        padding: 0,
                        minWidth: 22,
                        fontSize: 18,
                        color: '#888',
                        marginLeft: 2,
                      }}>
                      ×
                    </Button>
                  </Flex>
                );
              })}
            </Flex>
          </>
        )}
      </Box>
    </Box>
  );
};

export default FieldMappingScreen;
