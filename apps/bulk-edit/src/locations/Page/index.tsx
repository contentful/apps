import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Notification,
  Skeleton,
  Spinner,
  Table,
  Text,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeProps, EntryProps } from 'contentful-management';
import { ContentTypeField, FieldFilterValue, FilterOption } from './types';
import { styles } from './styles';
import { ContentTypeSidebar } from './components/ContentTypeSidebar';
import { SORT_OPTIONS } from './components/SortMenu';
import { EntryTable } from './components/EntryTable';
import { BulkEditModal } from './components/BulkEditModal';
import { UndoBulkEditModal } from './components/UndoBulkEditModal';
import { SearchBar } from './components/SearchBar';
import {
  fetchEntriesWithBatching,
  getEntryFieldValue,
  mapContentTypePropsToFields,
  processEntriesInBatches,
  STATUSES,
  updateEntryFieldLocalized,
} from './utils/entryUtils';
import { successNotification } from './utils/successNotification';
import { API_LIMITS, BATCH_FETCHING, BATCH_PROCESSING, PAGE_SIZE_OPTIONS } from './utils/constants';
import { ErrorNote } from './components/ErrorNote';
import { EmptyEntryBanner } from './components/EmptyEntryBanner';
import { buildQuery, fieldFilterValuesToQuery } from './utils/contentfulQueryUtils';
import { FieldVisibiltyMenu } from './components/FieldVisibiltyMenu';
import tokens from '@contentful/f36-tokens';

const getFieldsMapped = (fields: ContentTypeField[]) => {
  return fields.map((field) => ({
    label: field.locale ? `(${field.locale}) ${field.name}` : field.name,
    value: field.uniqueId,
  }));
};

const statusOptions: FilterOption[] = STATUSES.map((status) => ({
  label: status,
  value: status.toLowerCase(),
}));

const Page = () => {
  const sdk = useSDK();
  const locales = sdk.locales.available;
  const defaultLocale = sdk.locales.default;
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<string | undefined>(undefined);
  const [allContentTypesLoading, setAllContentTypesLoading] = useState(true);
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
  const [selectedColumns, setSelectedColumns] = useState<FilterOption[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<FilterOption[]>([]); //statusOptions);
  const [currentContentType, setCurrentContentType] = useState<ContentTypeProps | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchFieldFilterValues, setSearchFieldFilterValues] = useState<FieldFilterValue[]>([]);
  const [searchFieldFilterArgs, setSearchFieldFilterArgs] = useState<string>('');
  // const [initialTotal, setInitialTotal] = useState(0);
  // Used to force a re-render of the table when the selection changes
  const [tableKey, setTableKey] = useState(0);

  const hasActiveFilters = () => {
    const hasSearchQuery = searchQuery.trim() !== '';
    const hasSearchFieldFilterValues = searchFieldFilterValues.length > 0;
    const hasStatusFilter = selectedStatuses.length > 0;
    const hasColumnFilter = selectedColumns.length !== getFieldsMapped(fields).length;
    return hasSearchQuery || hasStatusFilter || hasColumnFilter || hasSearchFieldFilterValues;
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSearchFieldFilterValues([]);
    setSelectedStatuses([]);
    setSelectedColumns(getFieldsMapped(fields));
    setActivePage(0);
  };

  const shouldDisableFilters = (disableIfLoading: boolean = true) => {
    return !selectedContentType || (disableIfLoading ? entriesLoading : false);
  };

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

  const clearBasicState = () => {
    setEntries([]);
    setFields([]);
    setTotalEntries(0);
  };

  // Used to clear the selection states and force a re-render of the table
  const clearSelectionState = () => {
    setSelectedField(null);
    setSelectedEntryIds([]);
    setTableKey((tableKey) => tableKey + 1);
  };

  useEffect(() => {
    setSearchFieldFilterArgs(fieldFilterValuesToQuery(searchFieldFilterValues).queryString);
  }, [searchFieldFilterValues]);

  // ------------------------------------------------------------
  // ALL Content Types Fetch
  // ------------------------------------------------------------
  useEffect(() => {
    const fetchContentTypes = async (): Promise<void> => {
      try {
        setAllContentTypesLoading(true);
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
        setAllContentTypesLoading(false);
      }
    };
    void fetchContentTypes();
  }, []);

  // ------------------------------------------------------------
  // Content Type Fetch
  // Fetch content type and fields when selectedContentTypeId changes
  // ------------------------------------------------------------
  useEffect(() => {
    const fetchContentTypeAndFields = async (): Promise<void> => {
      if (!selectedContentTypeId) {
        clearBasicState();
        return;
      }

      setContentTypeLoading(true);
      try {
        const ct = await sdk.cma.contentType.get({ contentTypeId: selectedContentTypeId });
        const editorInterface = await sdk.cma.editorInterface.get({
          contentTypeId: ct.sys.id,
        });
        resetFilters();
        clearSelectionState();

        const newFields = mapContentTypePropsToFields(ct, editorInterface, locales);
        setFields(newFields);
        setSelectedColumns(getFieldsMapped(newFields));
        setCurrentContentType(ct);
      } catch (e) {
        resetFilters();
        clearSelectionState();
        clearBasicState();
        setSelectedColumns([]);
        setCurrentContentType(null);
      }

      setContentTypeLoading(false);
    };
    void fetchContentTypeAndFields();
  }, [sdk, selectedContentTypeId]);

  // ------------------------------------------------------------
  // Entries Fetch
  // Fetch entries when pagination, sorting, or content type changes
  // ------------------------------------------------------------
  useEffect(() => {
    const fetchEntries = async (): Promise<void> => {
      if (fields.length === 0 || !currentContentType) {
        return;
      }
      setEntriesLoading(true);
      try {
        const displayField = currentContentType.displayField || null;
        const statusLabels = selectedStatuses.map((status) => status.label);

        const baseQuery = buildQuery(
          sortOption,
          displayField,
          statusLabels,
          currentContentType.sys.id,
          activePage,
          itemsPerPage,
          searchFieldFilterValues,
          searchQuery
        );

        const { entries, total } = await fetchEntriesWithBatching(
          sdk,
          baseQuery,
          baseQuery.limit || BATCH_FETCHING.DEFAULT_BATCH_SIZE
        );
        setEntries(entries);
        setTotalEntries(total);
      } catch (e) {
        setEntries([]);
        setTotalEntries(0);
      } finally {
        setEntriesLoading(false);
      }
    };
    void fetchEntries();
  }, [
    sdk,
    activePage,
    itemsPerPage,
    sortOption,
    currentContentType,
    selectedStatuses,
    searchQuery,
    // searchFieldFilterValues,
    searchFieldFilterArgs,
    fields,
  ]);

  const selectedContentType = contentTypes.find((ct) => ct.sys.id === selectedContentTypeId);
  const selectedEntries = entries.filter((entry) => selectedEntryIds.includes(entry.sys.id));

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

  const onSave = async (val: any) => {
    setTotalUpdateCount(0);
    setEditionCount(0);
    setIsSaving(true);
    setFailedUpdates([]);
    val = val === '' ? null : val;

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
          value: val,
          count: successful.length,
          field: selectedField,
          onUndo: (formattedFirstValue) => {
            setUndoFirstEntryFieldValue(formattedFirstValue);
            setIsUndoModalOpen(true);
          },
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

  if (allContentTypesLoading) {
    return (
      <Flex alignItems="center" justifyContent="center" style={{ minHeight: '60vh' }}>
        <Spinner />
      </Flex>
    );
  }

  return (
    <Flex style={{ overflow: 'hidden' }}>
      <Box style={styles.mainContent}>
        <Box style={styles.mainContentBody}>
          <Flex style={{ minWidth: 0 }}>
            <ContentTypeSidebar
              contentTypes={contentTypes}
              selectedContentTypeId={selectedContentTypeId}
              onContentTypeSelect={(newCT) => {
                setSelectedContentTypeId(newCT);
              }}
              disabled={entriesLoading}
            />
            <div style={styles.spacer} />
            <Flex style={styles.tableContainer}>
              {contentTypeLoading && (
                <Flex alignItems="center" justifyContent="center" style={styles.loadingContainer}>
                  <Spinner />
                </Flex>
              )}
              {/* Heading */}
              <Heading style={styles.pageHeader}>
                {selectedContentType ? `Bulk edit ${selectedContentType.name}` : 'Bulk Edit App'}
              </Heading>
              {/* Search Section */}
              <SearchBar
                searchQuery={searchQuery}
                onSearchChange={(query, fieldFilterValues) => {
                  setSearchQuery(query);
                  setSearchFieldFilterValues(fieldFilterValues);
                  setSearchFieldFilterArgs(fieldFilterValuesToQuery(fieldFilterValues).queryString);
                  setActivePage(0);
                  clearSelectionState();
                }}
                isDisabled={shouldDisableFilters(false)}
                debounceDelay={300}
                fields={selectedColumns.flatMap(
                  (field) => fields.find((f) => f.uniqueId === field.value) || []
                )}
                fieldFilterValues={searchFieldFilterValues}
                setFieldFilterValues={setSearchFieldFilterValues}
                statusOptions={statusOptions}
                selectedStatuses={selectedStatuses}
                setSelectedStatuses={setSelectedStatuses}
                clearSelectionState={clearSelectionState}
                setActivePage={setActivePage}
                resetFilters={resetFilters}
                hasActiveFilters={hasActiveFilters}
                sortOption={sortOption}
                setSortOption={setSortOption}
              />
              {!entriesLoading && (
                <>
                  <Flex style={styles.editButton}>
                    <Button
                      variant="primary"
                      onClick={() => setIsModalOpen(true)}
                      isDisabled={!selectedField || selectedEntryIds.length === 0}>
                      {selectedEntryIds.length > 1 ? 'Bulk edit' : 'Edit'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => clearSelectionState()}
                      isDisabled={!selectedField || selectedEntryIds.length === 0}>
                      Clear selection
                    </Button>
                    <Text fontColor="gray600">
                      {selectedEntryIds.length || 'No'} entry field
                      {selectedEntryIds.length === 1 ? '' : 's'} selected
                    </Text>
                    <div style={{ flex: 1 }} />
                    <FieldVisibiltyMenu
                      selectedColumns={selectedColumns}
                      setSelectedColumns={setSelectedColumns}
                      fields={fields}
                      getFieldsMapped={getFieldsMapped}
                    />
                  </Flex>
                </>
              )}
              {entriesLoading ? (
                <Table style={styles.loadingTableBorder}>
                  <Table.Body>
                    <Skeleton.Row rowCount={5} columnCount={5} />
                  </Table.Body>
                </Table>
              ) : (
                <>
                  {entries.length === 0 || !selectedContentType ? (
                    <EmptyEntryBanner hasEntries={entries.length > 0} />
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
                        key={tableKey}
                        entries={entries}
                        fields={selectedColumns.flatMap(
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
                        onItemsPerPageChange={(itemsPerPage) => {
                          setItemsPerPage(itemsPerPage);
                          setActivePage(0);
                        }}
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
            </Flex>
          </Flex>
        </Box>
      </Box>

      <BulkEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSave}
        selectedEntries={selectedEntries}
        selectedField={selectedField}
        locales={sdk.locales}
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
