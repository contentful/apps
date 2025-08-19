import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Flex,
  Spinner,
  Button,
  Text,
  Notification,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentFields, ContentTypeProps, KeyValueMap, EntryProps } from 'contentful-management';
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
} from './utils/entryUtils';
import { BATCH_PROCESSING, API_LIMITS } from './utils/constants';
import { ErrorNote } from './components/ErrorNote';

const PAGE_SIZE_OPTIONS = [50, 75, 100, 300, 1000];

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
  const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE_OPTIONS[0]);
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
  const [pageSizeOptions, setPageSizeOptions] = useState(PAGE_SIZE_OPTIONS);

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

  const buildQuery = (sortOption: string, displayField: string | null) => {
    const getOrder = (sortOption: string) => {
      if (sortOption === 'updatedAt_desc') return '-sys.updatedAt';
      else if (sortOption === 'updatedAt_asc') return 'sys.updatedAt';
      else if (displayField === null) return undefined;
      else if (sortOption === 'displayName_asc') return `fields.${displayField}`;
      else if (sortOption === 'displayName_desc') return `-fields.${displayField}`;
    };

    return {
      content_type: selectedContentTypeId,
      skip: activePage * itemsPerPage,
      limit: itemsPerPage,
      order: getOrder(sortOption),
    };
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
    setActivePage(0);
  }, [selectedContentTypeId, sortOption]);

  useEffect(() => {
    const fetchFieldsAndEntries = async (): Promise<void> => {
      if (!selectedContentTypeId) {
        setEntries([]);
        setFields([]);
        setTotalEntries(0);
        return;
      }
      setEntriesLoading(true);
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
        const displayField = ct.displayField || null;

        const { items, total } = await sdk.cma.entry.getMany({
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
          query: buildQuery(sortOption, displayField),
        });
        setEntries(items || []);
        setTotalEntries(total || 0);
      } catch (e) {
        setEntries([]);
        setFields([]);
        setTotalEntries(0);
      } finally {
        setEntriesLoading(false);
      }
    };
    void fetchFieldsAndEntries();
  }, [sdk, selectedContentTypeId, activePage, itemsPerPage, sortOption]);

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
        ? `${firstUpdatedValue} was updated to ${value}`
        : `${firstUpdatedValue} and ${count - 1} more entry fields were updated to ${value}`;
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

  // TODO: Figure out if we need to use this function or not
  const fetchLatestEntries = async (entryIds: string[]) => {
    const allEntries: EntryProps[] = [];
    let skip = 0;
    const limit = API_LIMITS.DEFAULT_PAGINATION_LIMIT;
    let fetched: number;

    do {
      const response = await sdk.cma.entry.getMany({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        query: {
          'sys.id[in]': entryIds.join(','),
          skip,
          limit,
        },
      });
      const items = response.items as EntryProps[];
      allEntries.push(...items);
      fetched = items.length;
      skip += limit;
    } while (fetched === limit);

    return allEntries;
  };

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
    setIsSaving(true);
    setFailedUpdates([]);

    try {
      if (!selectedField) return;

      const entryIds = selectedEntries.map((entry) => entry.sys.id);
      const latestEntries = await fetchLatestEntries(entryIds);

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

          return { success: true, entry: updated };
        } catch {
          return { success: false, entry: latestEntry };
        }
      };

      // Process entries in batches with rate limiting
      const results = await processEntriesInBatches(
        latestEntries,
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
    if (Object.keys(backupToUse).length === 0) return;

    setIsSaving(true);
    setFailedUpdates([]);

    try {
      const entryIds = Object.keys(backupToUse);
      const currentEntries = await fetchLatestEntries(entryIds);

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
              onContentTypeSelect={setSelectedContentTypeId}
            />
            <div style={styles.stickySpacer} />
            <Box>
              <>
                <Heading style={styles.stickyPageHeader}>
                  {selectedContentType ? `Bulk edit ${selectedContentType.name}` : 'Bulk Edit App'}
                </Heading>
                {(entries.length === 0 && !entriesLoading) || !selectedContentType ? (
                  <Box style={styles.noEntriesText}>No entries found.</Box>
                ) : (
                  <>
                    <SortMenu sortOption={sortOption} onSortChange={setSortOption} />
                    {selectedField && selectedEntryIds.length > 0 && (
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
                      <Spinner />
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
                          fields={fields}
                          contentType={selectedContentType}
                          spaceId={sdk.ids.space}
                          environmentId={sdk.ids.environment}
                          defaultLocale={defaultLocale}
                          activePage={activePage}
                          totalEntries={totalEntries}
                          itemsPerPage={itemsPerPage}
                          onPageChange={setActivePage}
                          onItemsPerPageChange={setItemsPerPage}
                          pageSizeOptions={pageSizeOptions}
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
      />
    </Flex>
  );
};

export default Page;
