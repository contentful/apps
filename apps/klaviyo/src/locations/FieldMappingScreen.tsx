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
  locale?: string;
}

// Define interface for field items
interface FieldItem {
  id: string;
  name: string;
  type?: string;
}

export const FieldMappingScreen: React.FC = () => {
  const sdk = useSDK<PageExtensionSDK>();
  const [contentTypes, setContentTypes] = useState<Record<string, string>>({});
  const [entries, setEntries] = useState<
    Array<{ id: string; title: string; contentTypeId: string }>
  >([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string>('');
  const [isFieldsModalOpen, setIsFieldsModalOpen] = useState(false);
  const [checkedFields, setCheckedFields] = useState<string[]>([]);
  const [selectedEntryGroup, setSelectedEntryGroup] = useState<ExtendedFieldData[] | null>(null);
  const [modalAvailableFields, setModalAvailableFields] = useState<FieldItem[]>([]);
  const [allEntryMappings, setAllEntryMappings] = useState<
    { entryId: string; title: string; contentTypeId: string; mappings: any[] }[]
  >([]);
  const [modalEntryId, setModalEntryId] = useState<string | null>(null);
  const [availableLocales, setAvailableLocales] = useState<string[]>([]);
  const [selectedLocales, setSelectedLocales] = useState<string[]>([]);
  // Add step state for modal navigation
  const [modalStep, setModalStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate the number of unique entries with at least one mapping
  const connectedEntryIds = React.useMemo(() => {
    return Array.from(
      new Set(
        allEntryMappings.filter((e) => e.mappings && e.mappings.length > 0).map((e) => e.entryId)
      )
    );
  }, [allEntryMappings]);
  const connectedCount = connectedEntryIds.length;
  const maxCount = 25;

  // Build a map from field ID to array of mapped locales for the current entry
  const fieldLocaleMap: Record<string, string[]> = React.useMemo(() => {
    const map: Record<string, string[]> = {};
    (selectedEntryGroup || []).forEach((m) => {
      if (!map[m.id]) map[m.id] = [];
      if (m.locale && !map[m.id].includes(m.locale)) {
        map[m.id].push(m.locale);
      }
    });
    return map;
  }, [selectedEntryGroup]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Get content type names for display
        const ctNames: Record<string, string> = {};
        const contentTypesList: Array<{ id: string; name: string }> = [];

        try {
          const ctResponse = await sdk.cma.contentType.getMany({
            spaceId: sdk.ids.space,
            environmentId: sdk.ids.environment,
          });

          ctResponse.items.forEach((contentType) => {
            ctNames[contentType.sys.id] = contentType.name;
            contentTypesList.push({
              id: contentType.sys.id,
              name: contentType.name,
            });
          });
        } catch (ctError) {
          console.warn('[FieldMappingScreen] Failed to load content type names:', ctError);
        }

        setContentTypes(ctNames);
      } catch (error) {
        console.error('[FieldMappingScreen] Error loading mappings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Clean up on unmount: nothing to clean
  }, [selectedEntryId, sdk]);

  // Fetch entries when content type is selected
  useEffect(() => {
    const fetchAllEntries = async () => {
      setIsLoading(true);
      setEntries([]);
      setSelectedEntryId('');
      try {
        const entriesResponse = await sdk.cma.entry.getMany({
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
          query: {
            limit: 1000,
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
            contentTypeId: entry.sys.contentType?.sys?.id || 'unknown',
          }))
        );
      } catch (error) {
        console.error('Error loading all entries:', error);
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllEntries();
  }, [sdk]);

  // Fetch all entries for the selected content type and load their mappings
  useEffect(() => {
    const loadAllEntryMappings = async () => {
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
    };
    loadAllEntryMappings();
  }, [entries, sdk]);

  // Helper to determine if any selected field is localized
  const anySelectedFieldLocalized = React.useMemo(() => {
    return checkedFields.some((fieldId) => {
      const field = modalAvailableFields.find((f) => f.id === fieldId);
      return field && (field as any).localized;
    });
  }, [checkedFields, modalAvailableFields]);

  const onSave = async () => {
    if (modalEntryId && modalAvailableFields.length > 0) {
      try {
        // Get the actual entry data to extract field values
        const entry = await sdk.cma.entry.get({
          entryId: modalEntryId,
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
        });

        // Build new mappings for checked fields and selected locales
        const newMappings: any[] = [];
        for (const field of modalAvailableFields.filter((f) => checkedFields.includes(f.id))) {
          for (const locale of selectedLocales) {
            // Extract the actual field value from the entry data
            let fieldValue = '';
            if (entry.fields && entry.fields[field.id]) {
              const fieldData = entry.fields[field.id];
              if (typeof fieldData === 'object' && !Array.isArray(fieldData)) {
                // Handle localized fields
                fieldValue = fieldData[locale] || fieldData['en-US'] || '';
              } else {
                // Handle non-localized fields
                fieldValue = fieldData || '';
              }
            }

            newMappings.push({
              id: field.id,
              name: field.name,
              type: field.type,
              fieldType:
                field.type?.toLowerCase() === 'richtext' || field.type === 'RichText'
                  ? 'richtext'
                  : field.type?.toLowerCase(),
              value: fieldValue,
              isAsset: field.type === 'Asset' || field.type === 'AssetLink' || false,
              locale,
            });
          }
        }
        await setEntryKlaviyoFieldMappings(sdk, modalEntryId, newMappings);
        // Update allEntryMappings for immediate UI feedback
        setAllEntryMappings((prev) =>
          prev.map((e) => (e.entryId === modalEntryId ? { ...e, mappings: newMappings } : e))
        );
        setIsFieldsModalOpen(false);
        setModalStep(1); // Reset step for next open
      } catch (err) {
        console.error('Failed to save field mappings:', err);
        setIsFieldsModalOpen(false);
        setModalStep(1);
      }
    } else {
      setIsFieldsModalOpen(false);
      setModalStep(1);
    }
  };

  return (
    <Box style={{ maxWidth: '1000px', margin: '40px auto', padding: 0 }}>
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
              <TableCell>Updated</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Connected fields</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                  <Flex justifyContent="center" alignItems="center">
                    <Text>Loading entries...</Text>
                  </Flex>
                </TableCell>
              </TableRow>
            ) : (
              entries
                .filter((entry) => {
                  const entryMappings =
                    allEntryMappings.find((e) => e.entryId === entry.id)?.mappings || [];
                  return entryMappings.length > 0;
                })
                .map((entry, idx) => {
                  const entryMappings =
                    allEntryMappings.find((e) => e.entryId === entry.id)?.mappings || [];
                  const openModalForEntry = async () => {
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
                      localized: field.localized,
                    }));
                    setModalAvailableFields(allFields);
                    // Fetch locales
                    const environment = await sdk.cma.environment.get({
                      environmentId: sdk.ids.environment,
                      spaceId: space.sys.id,
                    });
                    const localesResponse = await sdk.cma.locale.getMany({
                      spaceId: space.sys.id,
                      environmentId: environment.sys.id,
                    });
                    const locales = localesResponse.items.map((locale: any) => locale.code);
                    // Determine all mapped locales for this entry
                    const mappedLocales = Array.from(
                      new Set(entryMappings.map((f) => f.locale).filter(Boolean))
                    );
                    setAvailableLocales(locales);
                    setSelectedLocales(
                      mappedLocales.length > 0
                        ? mappedLocales
                        : locales.length > 0
                        ? [locales[0]]
                        : []
                    );
                    // Get mapped field IDs for this entry
                    const mappedFieldIds = entryMappings.map((f) => f.id);
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
                  };
                  return (
                    <TableRow
                      key={entry.id}
                      style={{ cursor: 'pointer' }}
                      onClick={openModalForEntry}>
                      <TableCell>{entry.title}</TableCell>
                      <TableCell>
                        {contentTypes[entry.contentTypeId] || entry.contentTypeId}
                      </TableCell>
                      <TableCell>Just now</TableCell>
                      <TableCell>
                        <Badge
                          variant={idx % 2 === 0 ? 'positive' : 'warning'}
                          style={{ textTransform: 'capitalize' }}>
                          {idx % 2 === 0 ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell>{entryMappings.length}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            openModalForEntry();
                          }}>
                          View fields
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
            )}
          </TableBody>
        </Table>
      </Box>
      {/* Modal for connected fields */}
      <Modal
        style={{ padding: 0 }}
        isShown={isFieldsModalOpen}
        onClose={() => setIsFieldsModalOpen(false)}
        size="medium"
        aria-label="Connected fields">
        <Modal.Header
          title="Connected fields"
          onClose={() => {
            setIsFieldsModalOpen(false);
            setModalStep(1);
          }}
        />
        <Modal.Content>
          {(() => {
            if (modalAvailableFields.length > 0) {
              return (
                <div style={{ maxHeight: 400, overflowY: 'auto', padding: 0 }}>
                  <Box style={{ padding: 16 }}>
                    {/* Step 1: Field selection UI */}
                    {modalStep === 1 && (
                      <>
                        <Box
                          style={{
                            border: '1px solid #e5ebed',
                            borderRadius: 8,
                            padding: 16,
                            marginBottom: 16,
                          }}>
                          <Flex justifyContent="space-between" alignItems="center">
                            <Flex gap="spacingL" alignItems="center">
                              <Box>
                                <Text fontWeight="fontWeightMedium">Entry name: </Text>
                                <Text>
                                  {entries.find((e) => e.id === modalEntryId)?.title || ''}
                                </Text>
                              </Box>
                            </Flex>
                            <Button
                              variant="secondary"
                              size="small"
                              style={{ alignSelf: 'flex-end' }}
                              onClick={() => {
                                if (modalEntryId) {
                                  const spaceId = sdk.ids.space;
                                  const environmentId = sdk.ids.environment;
                                  const entryUrl = `https://app.contentful.com/spaces/${spaceId}/environments/${environmentId}/entries/${modalEntryId}`;
                                  window.open(entryUrl, '_blank', 'noopener');
                                }
                              }}>
                              View entry
                            </Button>
                          </Flex>
                        </Box>
                        <Box
                          style={{ border: '1px solid #e5ebed', borderRadius: 6, marginTop: 16 }}>
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
                                <TableCell style={{ paddingLeft: 0 }}>
                                  Select all fields ({checkedFields.length})
                                </TableCell>
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
                                  <TableCell style={{ paddingLeft: 0 }}>
                                    <div style={{ fontWeight: 600 }}>{field.name}</div>
                                    {fieldLocaleMap[field.id] &&
                                      fieldLocaleMap[field.id].length > 0 && (
                                        <div
                                          style={{
                                            color: '#67728A',
                                            fontSize: 13,
                                            marginTop: 2,
                                            paddingLeft: 0,
                                          }}>
                                          {fieldLocaleMap[field.id].length === 1
                                            ? fieldLocaleMap[field.id][0]
                                            : fieldLocaleMap[field.id].length <= 3
                                            ? `${fieldLocaleMap[field.id].length} locales`
                                            : `${fieldLocaleMap[field.id][0]} and ${
                                                fieldLocaleMap[field.id].length - 1
                                              } more locales`}
                                        </div>
                                      )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      </>
                    )}
                    {/* Step 2: Locale selection UI (only if any selected field is localized) */}
                    {modalStep === 2 && anySelectedFieldLocalized && (
                      <Box style={{ marginBottom: 16 }}>
                        <Text fontWeight="fontWeightMedium">Select locales:</Text>
                        <Flex gap="spacingS" style={{ marginTop: 8 }}>
                          {availableLocales.map((locale) => (
                            <Checkbox
                              key={locale}
                              isChecked={selectedLocales.includes(locale)}
                              onChange={() => {
                                setSelectedLocales((prev) =>
                                  prev.includes(locale)
                                    ? prev.filter((l) => l !== locale)
                                    : [...prev, locale]
                                );
                              }}>
                              {locale}
                            </Checkbox>
                          ))}
                        </Flex>
                      </Box>
                    )}
                  </Box>
                </div>
              );
            }
            return null;
          })()}
        </Modal.Content>
        <Modal.Controls>
          <div
            style={{ position: 'sticky', bottom: 0, background: '#fff', zIndex: 2, padding: 16 }}>
            {/* If any selected field is localized, use two-step process */}
            <Button
              variant="secondary"
              style={{ marginRight: 16 }}
              onClick={() => {
                setIsFieldsModalOpen(false);
                setModalStep(1);
              }}>
              Cancel
            </Button>
            {anySelectedFieldLocalized ? (
              <>
                {modalStep === 1 && (
                  <Button
                    variant="primary"
                    onClick={() => setModalStep(2)}
                    isDisabled={checkedFields.length === 0}
                    style={{ marginRight: 16 }}>
                    Next
                  </Button>
                )}
                {modalStep === 2 && (
                  <>
                    <Button variant="secondary" onClick={() => setModalStep(1)}>
                      Back
                    </Button>
                    <Button
                      style={{ marginRight: 8, marginLeft: 8 }}
                      variant="primary"
                      onClick={onSave}
                      isDisabled={selectedLocales.length === 0}>
                      Save
                    </Button>
                  </>
                )}
              </>
            ) : (
              // If all selected fields are non-localized, show Save button on step 1
              modalStep === 1 && (
                <Button
                  style={{ marginRight: 8 }}
                  variant="primary"
                  onClick={onSave}
                  isDisabled={checkedFields.length === 0}>
                  Save
                </Button>
              )
            )}
          </div>
        </Modal.Controls>
      </Modal>
    </Box>
  );
};

export default FieldMappingScreen;
