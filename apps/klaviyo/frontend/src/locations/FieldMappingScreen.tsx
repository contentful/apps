import React, { useEffect, useState, useRef } from 'react';
import { PageExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Modal,
  Badge,
  Checkbox,
} from '@contentful/f36-components';
import logger from '../utils/logger';
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
  const [availableContentTypes, setAvailableContentTypes] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedContentType, setSelectedContentType] = useState<string>('');
  const [availableFields, setAvailableFields] = useState<FieldItem[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [syncMessage, setSyncMessage] = useState('');
  const [entries, setEntries] = useState<
    Array<{ id: string; title: string; contentTypeId: string }>
  >([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string>('');
  const [isEntriesLoading, setIsEntriesLoading] = useState(false);
  const [isFieldsModalOpen, setIsFieldsModalOpen] = useState(false);
  const [checkedFields, setCheckedFields] = useState<string[]>([]);
  const [selectedEntryGroup, setSelectedEntryGroup] = useState<ExtendedFieldData[] | null>(null);
  const [modalAvailableFields, setModalAvailableFields] = useState<FieldItem[]>([]);
  const [allEntryMappings, setAllEntryMappings] = useState<
    { entryId: string; title: string; contentTypeId: string; mappings: any[] }[]
  >([]);
  const [modalEntryId, setModalEntryId] = useState<string | null>(null);
  const [modalContentTypeId, setModalContentTypeId] = useState<string | null>(null);
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

  return (
    <Box style={{ maxWidth: '1000px', margin: '40px auto' }}>
      <Flex justifyContent="space-between" alignItems="center" style={{ marginBottom: 24 }}>
        <Box>
          <Heading as="h2" marginBottom="none">
            Klaviyo Universal Content
          </Heading>
        </Box>
        <Text fontWeight="fontWeightMedium" fontColor="gray600">
          Connected entries: {connectedCount}/{maxCount}
        </Text>
      </Flex>
      <Box
        style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px #e5ebed', padding: 0 }}>
        <Table style={{ minWidth: 800 }}>
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
            {entries.map((entry, idx) => {
              const entryMappings =
                allEntryMappings.find((e) => e.entryId === entry.id)?.mappings || [];
              return (
                <TableRow
                  key={entry.id}
                  style={{ cursor: 'pointer' }}
                  onClick={async () => {
                    // Fetch all fields for this entry's content type
                    const space = await sdk.cma.space.get({});
                    const contentType = await sdk.cma.contentType.get({
                      spaceId: space.sys.id,
                      environmentId: sdk.ids.environment,
                      contentTypeId: entry.contentTypeId,
                    });
                    const allFields = contentType.fields.map((field: any) => ({
                      id: field.id,
                      name: field.name,
                      type: field.type,
                    }));
                    setModalAvailableFields(allFields);
                    // Get mapped field IDs for this entry
                    const mappedFieldIds = entryMappings.map((f) => f.id);
                    // Debug logging
                    console.log(
                      'Available field IDs:',
                      allFields.map((f) => f.id)
                    );
                    console.log('Mapped field IDs:', mappedFieldIds);
                    // Normalize IDs for comparison
                    const normalize = (id: string) => id.trim().toLowerCase();
                    const checked = allFields
                      .map((f) => f.id)
                      .filter((id) => mappedFieldIds.map(normalize).includes(normalize(id)));
                    setCheckedFields(checked);
                    setSelectedEntryGroup(entryMappings);
                    setModalEntryId(entry.id);
                    // Delay opening modal to ensure state is set
                    setTimeout(() => setIsFieldsModalOpen(true), 0);
                  }}>
                  <TableCell>{entry.title}</TableCell>
                  <TableCell>{contentTypes[entry.contentTypeId] || entry.contentTypeId}</TableCell>
                  <TableCell>{entryMappings.length}</TableCell>
                  <TableCell>Just now</TableCell>
                  <TableCell>
                    <Badge
                      variant={idx % 2 === 0 ? 'positive' : 'warning'}
                      style={{ textTransform: 'capitalize' }}>
                      {idx % 2 === 0 ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
      {/* Modal for connected fields */}
      <Modal
        isShown={isFieldsModalOpen}
        onClose={() => setIsFieldsModalOpen(false)}
        size="medium"
        aria-label="Connected fields">
        <Modal.Header title="Connected fields" />
        <Modal.Content>
          {(() => {
            if (modalAvailableFields.length > 0) {
              // Debug log for checkedFields in modal render
              console.log('Rendering modal, checkedFields:', checkedFields);
              return (
                <Box>
                  <Flex
                    justifyContent="space-between"
                    alignItems="center"
                    style={{ marginBottom: 16 }}>
                    <Flex gap="spacingL" alignItems="center">
                      <Box>
                        <Text fontWeight="fontWeightMedium">Entry name: </Text>
                        <Text>{entries.find((e) => e.id === modalEntryId)?.title || ''}</Text>
                      </Box>
                      <Box>
                        <Text fontWeight="fontWeightMedium">Connected fields: </Text>
                        <Text>{checkedFields.length}</Text>
                      </Box>
                    </Flex>
                    <Button variant="secondary" size="small" style={{ alignSelf: 'flex-end' }}>
                      View entry
                    </Button>
                  </Flex>
                  <Box style={{ border: '1px solid #e5ebed', borderRadius: 6, marginTop: 16 }}>
                    <Table style={{ minWidth: 400, margin: 0 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell style={{ width: 48 }}>
                            <Checkbox
                              isChecked={
                                modalAvailableFields.length > 0 &&
                                checkedFields.length === modalAvailableFields.length
                              }
                              isIndeterminate={
                                checkedFields.length > 0 &&
                                checkedFields.length < modalAvailableFields.length
                              }
                              onChange={() => {
                                if (checkedFields.length === modalAvailableFields.length) {
                                  setCheckedFields([]);
                                } else {
                                  setCheckedFields(modalAvailableFields.map((f) => f.id));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>Field name</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {modalAvailableFields.map((field, idx) => (
                          <TableRow key={field.id || idx}>
                            <TableCell>
                              <Checkbox
                                isChecked={checkedFields.includes(field.id)}
                                onChange={() => {
                                  setCheckedFields((prev) =>
                                    prev.includes(field.id)
                                      ? prev.filter((f) => f !== field.id)
                                      : [...prev, field.id]
                                  );
                                }}
                              />
                            </TableCell>
                            <TableCell>{field.name}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Box>
              );
            }
            return null;
          })()}
        </Modal.Content>
        <Modal.Controls>
          <Button
            variant="secondary"
            onClick={async () => {
              if (modalEntryId && modalAvailableFields.length > 0) {
                try {
                  // Build new mappings for checked fields
                  const newMappings = modalAvailableFields
                    .filter((f) => checkedFields.includes(f.id))
                    .map((f) => ({
                      id: f.id,
                      name: f.name,
                      type: f.type,
                      value: '',
                      contentTypeId: modalContentTypeId,
                      isAsset: f.type === 'Asset' || f.type === 'AssetLink' || false,
                    }));
                  await setEntryKlaviyoFieldMappings(sdk, modalEntryId, newMappings);
                  // Update allEntryMappings for immediate UI feedback
                  setAllEntryMappings((prev) =>
                    prev.map((e) =>
                      e.entryId === modalEntryId ? { ...e, mappings: newMappings } : e
                    )
                  );
                  setIsFieldsModalOpen(false);
                } catch (err) {
                  logger.error('Failed to save field mappings:', err);
                  setIsFieldsModalOpen(false);
                }
              } else {
                setIsFieldsModalOpen(false);
              }
            }}>
            Close
          </Button>
        </Modal.Controls>
      </Modal>
    </Box>
  );
};

export default FieldMappingScreen;
