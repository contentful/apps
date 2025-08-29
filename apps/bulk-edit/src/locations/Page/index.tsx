import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Flex,
  Spinner,
  Button,
  Text,
  Notification,
  Skeleton,
  Table,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import {
  ContentFields,
  ContentTypeProps,
  KeyValueMap,
  EntryProps,
  QueryOptions,
} from 'contentful-management';
import { ContentTypeField } from './types';
import { styles } from './styles';
import { ContentTypeSidebar } from './components/ContentTypeSidebar';
import { SortMenu, SORT_OPTIONS } from './components/SortMenu';
import { EntryTable } from './components/EntryTable';
import { BulkEditModal } from './components/BulkEditModal';
import { UndoBulkEditModal } from './components/UndoBulkEditModal';
import {
  updateEntryFieldLocalized,
  getEntryFieldValue,
  processEntriesInBatches,
  truncate,
  fetchEntriesWithBatching,
} from './utils/entryUtils';
import { BATCH_PROCESSING, API_LIMITS, PAGE_SIZE_OPTIONS, BATCH_FETCHING } from './utils/constants';
import { ErrorNote } from './components/ErrorNote';
import ColumnMultiselect from './components/ColumnMultiselect';

const Page = () => {
  const sdk = useSDK();
  const locales = sdk.locales.available;
  const defaultLocale = sdk.locales.default;
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<string | undefined>(undefined);
  const [contentTypeLoading, setContentTypeLoading] = useState(true);
  const [entries, setEntries] = useState<EntryProps[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [fields, setFields] = useState<ContentTypeField[]>([]);
  const [activePage, setActivePage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE_OPTIONS[0] as number);
  const [totalEntries, setTotalEntries] = useState(0);
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0].value);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [selectedField, setSelectedField] = useState<ContentTypeField | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [failedUpdates, setFailedUpdates] = useState<EntryProps[]>([]);
  const [lastUpdateBackup, setLastUpdateBackup] = useState<Record<string, EntryProps>>({});
  const [isUndoModalOpen, setIsUndoModalOpen] = useState(false);
  const [undoFirstEntryFieldValue, setUndoFirstEntryFieldValue] = useState('');
  const [totalUpdateCount, setTotalUpdateCount] = useState<number>(0);
  const [editionCount, setEditionCount] = useState<number>(0);
  const [selectedFields, setSelectedFields] = useState<{ label: string; value: string }[]>([]);
  const [currentContentType, setCurrentContentType] = useState<ContentTypeProps | null>(null);

  const getAllContentTypes = async (): Promise<ContentTypeProps[]> => {
    const allContentTypes: ContentTypeProps[] = [];
    let skip = 0;
    const limit = API_LIMITS.DEFAULT_PAGINATION_LIMIT;
    let fetched: number;

    do {
      const response = await sdk.cma.contentType.getMany({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        query: { skip, limit },
      });
      const items = response.items as ContentTypeProps[];
      allContentTypes.push(...items);
      fetched = items.length;
      skip += limit;
    } while (fetched === limit);

    return allContentTypes;
  };

  const buildQuery = (sortOption: string, displayField: string | null): QueryOptions => {
    const getOrder = (sortOption: string) => {
      if (sortOption === 'updatedAt_desc') return '-sys.updatedAt';
      else if (sortOption === 'updatedAt_asc') return 'sys.updatedAt';
      else if (displayField === null) return undefined;
      else if (sortOption === 'displayName_asc') return `fields.${displayField}`;
      else if (sortOption === 'displayName_desc') return `-fields.${displayField}`;
    };

    return {
      content_type: selectedContentTypeId,
      order: getOrder(sortOption),
      skip: activePage * itemsPerPage,
      limit: itemsPerPage,
    };
  };

  const clearState = () => {
    setEntries([]);
    setFields([]);
    setSelectedFields([]);
    setTotalEntries(0);
  };

  useEffect(() => {
    const fetchContentTypes = async (): Promise<void> => {
      try {
        setContentTypeLoading(true);
        const contentTypes = await getAllContentTypes();
        const sortedContentTypes = contentTypes
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name));

        setContentTypes(sortedContentTypes);
        if (sortedContentTypes.length > 0) {
          setSelectedContentTypeId(sortedContentTypes[0].sys.id);
        }
      } catch (e) {
        setContentTypes([]);
        setSelectedContentTypeId(undefined);
      } finally {
        setContentTypeLoading(false);
      }
    };
    void fetchContentTypes();
  }, [sdk]);

  useEffect(() => {
    clearState();
  }, [selectedContentTypeId, sortOption]);

  // Fetch content type and fields when selectedContentTypeId changes
  useEffect(() => {
    const fetchContentTypeAndFields = async (): Promise<void> => {
      if (!selectedContentTypeId) {
        clearState();
        return;
      }

      try {
        const ct = await sdk.cma.contentType.get({ contentTypeId: selectedContentTypeId });
        const newFields: ContentTypeField[] = [];
        ct.fields.forEach((f: ContentFields<KeyValueMap>) => {
          if (f.localized) {
            locales.forEach((locale) => {
              newFields.push({
                id: f.id,
                uniqueId: `${f.id}-${locale}`,
                name: f.name,
                type: f.type as any,
                locale: locale,
              });
            });
          } else {
            newFields.push({
              id: f.id,
              uniqueId: f.id,
              name: f.name,
              type: f.type as any,
            });
          }
        });
        setFields(newFields);
        setSelectedFields(
          newFields.map((field) => ({
            label: field.locale ? `(${field.locale}) ${field.name}` : field.name,
            value: field.uniqueId,
          }))
        );
        setCurrentContentType(ct);
      } catch (e) {
        setEntries([]);
        setFields([]);
        setSelectedFields([]);
        setTotalEntries(0);
        setCurrentContentType(null);
      }
    };
    void fetchContentTypeAndFields();
  }, [sdk, selectedContentTypeId, locales]);

  // Fetch entries when pagination, sorting, or content type changes
  useEffect(() => {
    const fetchEntries = async (): Promise<void> => {
      if (fields.length === 0 || !currentContentType) {
        return;
      }

      setEntriesLoading(true);
      try {
        const displayField = currentContentType.displayField || null;

        const baseQuery = buildQuery(sortOption, displayField);

        const { entries, total } = await fetchEntriesWithBatching(
          sdk,
          baseQuery,
          baseQuery.limit || BATCH_FETCHING.DEFAULT_BATCH_SIZE
        );

        setEntries(entries);
        setTotalEntries(total);
      } catch (e) {
        clearState();
      } finally {
        setEntriesLoading(false);
      }
    };
    void fetchEntries();
  }, [sdk, activePage, itemsPerPage, sortOption, currentContentType]);

  const selectedContentType = contentTypes.find((ct) => ct.sys.id === selectedContentTypeId);
  const selectedEntries = entries.filter((entry) => selectedEntryIds.includes(entry.sys.id));

  function successNotification({
    firstUpdatedValue,
    value,
    count,
  }: {
    firstUpdatedValue: string;
    value: string;
    count: number;
  }) {
    const message =
      count === 1
        ? `${truncate(firstUpdatedValue, 30)} was updated to ${truncate(value, 30)}`
        : `${truncate(firstUpdatedValue, 30)} and ${
            count - 1
          } more entry fields were updated to ${truncate(value, 30)}`;
    const notification = Notification.success(message, {
      title: 'Success!',
      cta: {
        label: 'Undo',
        textLinkProps: {
          variant: 'primary',
          onClick: () => {
            notification.then((item) => {
              Notification.close(item.id);
              setUndoFirstEntryFieldValue(firstUpdatedValue);
              setIsUndoModalOpen(true);
            });
          },
        },
      },
    });
  }

  const processBatchResults = (results: Array<{ success: boolean; entry: EntryProps }>) => {
    const successful = results.filter((r) => r.success).map((r) => r.entry);
    const failed = results.filter((r) => !r.success).map((r) => r.entry);
    return { successful, failed };
  };

  const updateEntriesList = (successful: EntryProps[]) => {
    setEntries((prev) =>
      prev.map((entry) => successful.find((u) => u.sys.id === entry.sys.id) || entry)
    );
  };

  const onSave = async (val: string | number) => {
    setTotalUpdateCount(0);
    setEditionCount(0);
    setIsSaving(true);
    setFailedUpdates([]);

    try {
      if (!selectedField) return;

      setTotalUpdateCount(selectedEntries.length);

      const backups: Record<string, EntryProps> = {};

      // Create update function for batch processing
      const updateEntry = async (latestEntry: EntryProps) => {
        backups[latestEntry.sys.id] = { ...latestEntry };

        try {
          const fieldId = selectedField.id;
          const fieldLocale = selectedField.locale || defaultLocale;
          const updatedFields = updateEntryFieldLocalized(
            latestEntry.fields,
            fieldId,
            val,
            fieldLocale
          );

          const updated = await sdk.cma.entry.update(
            {
              entryId: latestEntry.sys.id,
              spaceId: sdk.ids.space,
              environmentId: sdk.ids.environment,
            },
            { ...latestEntry, fields: updatedFields }
          );

          setEditionCount((editionCount) => editionCount + 1);

          return { success: true, entry: updated };
        } catch {
          return { success: false, entry: latestEntry };
        }
      };

      // Process entries in batches with rate limiting
      const results = await processEntriesInBatches(
        selectedEntries,
        updateEntry,
        BATCH_PROCESSING.DEFAULT_BATCH_SIZE,
        BATCH_PROCESSING.DEFAULT_DELAY_MS
      );

      const { successful, failed } = processBatchResults(results);

      updateEntriesList(successful);
      setFailedUpdates(failed);
      setLastUpdateBackup(backups);

      if (successful.length > 0) {
        const firstUpdatedValue = getEntryFieldValue(
          selectedEntries[0],
          selectedField,
          defaultLocale
        );
        successNotification({
          firstUpdatedValue: firstUpdatedValue,
          value: `${val}`,
          count: successful.length,
        });
      }

      setIsModalOpen(false);
    } catch (error) {
      if (failedUpdates.length === 0) {
        setFailedUpdates(selectedEntries);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const undoUpdates = async (backupToUse: Record<string, EntryProps>) => {
    setTotalUpdateCount(0);
    setEditionCount(0);

    if (Object.keys(backupToUse).length === 0) return;

    setIsSaving(true);
    setFailedUpdates([]);

    try {
      const entryIds = Object.keys(backupToUse);
      const currentEntries: EntryProps[] = [];

      // Fetch current entries in smaller chunks to avoid request size limits from the entries ids param in the query
      for (let i = 0; i < entryIds.length; i += API_LIMITS.CORS_QUERY_PARAM_LIMIT) {
        const chunk = entryIds.slice(i, i + API_LIMITS.CORS_QUERY_PARAM_LIMIT);
        const { entries } = await fetchEntriesWithBatching(
          sdk,
          { 'sys.id[in]': chunk.join(','), skip: 0, limit: chunk.length },
          BATCH_FETCHING.DEFAULT_BATCH_SIZE
        );
        currentEntries.push(...entries);
      }

      // Create restore function for batch processing
      const restoreEntry = async (currentEntry: EntryProps) => {
        const backupEntry = backupToUse[currentEntry.sys.id];

        try {
          const restoredEntry = await sdk.cma.entry.update(
            {
              spaceId: sdk.ids.space,
              environmentId: sdk.ids.environment,
              entryId: currentEntry.sys.id,
            },
            {
              ...currentEntry,
              fields: backupEntry.fields,
            }
          );

          setEditionCount((editionCount) => editionCount + 1);

          return { success: true, entry: restoredEntry };
        } catch {
          return { success: false, entry: currentEntry };
        }
      };

      // Process entries in batches with rate limiting
      const results = await processEntriesInBatches(
        currentEntries,
        restoreEntry,
        BATCH_PROCESSING.DEFAULT_BATCH_SIZE,
        BATCH_PROCESSING.DEFAULT_DELAY_MS
      );

      const { successful, failed } = processBatchResults(results);

      updateEntriesList(successful);
      setLastUpdateBackup({});
      setFailedUpdates(failed);

      if (successful.length > 0) {
        Notification.success('', { title: 'Undo complete' });
      }
    } catch (error) {
      if (failedUpdates.length === 0) {
        setFailedUpdates(Object.values(backupToUse));
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (contentTypeLoading) {
    return (
      <Flex alignItems="center" justifyContent="center" style={{ minHeight: '60vh' }}>
        <Spinner />
      </Flex>
    );
  }

  return (
    <Flex>
      <Box style={styles.mainContent} padding="spacingL">
        <Box style={styles.whiteBox} paddingTop="spacingL" paddingRight="spacingL">
          <Flex>
            <ContentTypeSidebar
              contentTypes={contentTypes}
              selectedContentTypeId={selectedContentTypeId}
              onContentTypeSelect={(newCT) => {
                setSelectedContentTypeId(newCT);
                setActivePage(0);
              }}
            />
            <div style={styles.stickySpacer} />
            <Box>
              <>
                {/* Heading */}
                <Heading style={styles.stickyPageHeader}>
                  {selectedContentType ? `Bulk edit ${selectedContentType.name}` : 'Bulk Edit App'}
                </Heading>
                {(entries.length === 0 && !entriesLoading) || !selectedContentType ? (
                  <Box style={styles.noEntriesText}>No entries found.</Box>
                ) : (
                  <>
                    <Flex gap="spacingS" alignItems="center">
                      <SortMenu sortOption={sortOption} onSortChange={(newSort) => {
                          setSortOption(newSort);
                          setActivePage(0);
                      }} />
                      <ColumnMultiselect
                        options={fields.map((field) => ({
                          label: field.locale ? `(${field.locale}) ${field.name}` : field.name,
                          value: field.uniqueId,
                        }))}
                        selectedFields={selectedFields}
                        setSelectedFields={setSelectedFields}
                      />
                    </Flex>
                    {selectedField && selectedEntryIds.length > 0 && !entriesLoading && (
                      <Flex alignItems="center" gap="spacingS" style={styles.editButton}>
                        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                          {selectedEntryIds.length === 1 ? 'Edit' : 'Bulk edit'}
                        </Button>
                        <Text fontColor="gray600">
                          {selectedEntryIds.length} entry field
                          {selectedEntryIds.length === 1 ? '' : 's'} selected
                        </Text>
                      </Flex>
                    )}
                    {entriesLoading ? (
                      <Table style={styles.loadingTableBorder}>
                        <Table.Body>
                          <Skeleton.Row rowCount={5} columnCount={5} />
                        </Table.Body>
                      </Table>
                    ) : (
                      <>
                        {failedUpdates.length > 0 && (
                          <ErrorNote
                            failedUpdates={failedUpdates}
                            selectedContentType={selectedContentType}
                            defaultLocale={defaultLocale}
                            onClose={() => setFailedUpdates([])}
                          />
                        )}
                        <EntryTable
                          entries={entries}
                          fields={selectedFields.flatMap(
                            (field) => fields.find((f) => f.uniqueId === field.value) || []
                          )}
                          contentType={selectedContentType}
                          spaceId={sdk.ids.space}
                          environmentId={sdk.ids.environment}
                          defaultLocale={defaultLocale}
                          activePage={activePage}
                          totalEntries={totalEntries}
                          itemsPerPage={itemsPerPage}
                          onPageChange={setActivePage}
                          onItemsPerPageChange={setItemsPerPage}
                          pageSizeOptions={PAGE_SIZE_OPTIONS}
                          onSelectionChange={({ selectedEntryIds, selectedFieldId }) => {
                            setSelectedEntryIds(selectedEntryIds);
                            setSelectedField(
                              fields.find((f) => f.uniqueId === selectedFieldId) || null
                            );
                          }}
                        />
                      </>
                    )}
                  </>
                )}
              </>
            </Box>
          </Flex>
        </Box>
      </Box>
      <BulkEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSave}
        selectedEntries={selectedEntries}
        selectedField={selectedField}
        defaultLocale={defaultLocale}
        isSaving={isSaving}
        totalUpdateCount={totalUpdateCount}
        editionCount={editionCount}
      />
      <UndoBulkEditModal
        isOpen={isUndoModalOpen}
        onClose={() => setIsUndoModalOpen(false)}
        onUndo={async () => {
          await undoUpdates(lastUpdateBackup);
          setIsUndoModalOpen(false);
        }}
        firstEntryFieldValue={undoFirstEntryFieldValue}
        isSaving={isSaving}
        entryCount={selectedEntryIds.length}
        editionCount={editionCount}
      />
    </Flex>
  );
};

export default Page;
