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
import {
  ContentFields,
  ContentTypeProps,
  EntryProps,
  KeyValueMap,
  QueryOptions,
} from 'contentful-management';
import { ContentTypeField, FilterOption } from './types';
import { styles } from './styles';
import { ContentTypeSidebar } from './components/ContentTypeSidebar';
import { SORT_OPTIONS, SortMenu } from './components/SortMenu';
import { EntryTable } from './components/EntryTable';
import { BulkEditModal } from './components/BulkEditModal';
import { UndoBulkEditModal } from './components/UndoBulkEditModal';
import { SearchBar } from './components/SearchBar';
import {
  fetchEntriesWithBatching,
  getStatusesOptions,
  getEntryFieldValue,
  getStatusFromEntry,
  getStatusFlags,
  processEntriesInBatches,
  truncate,
  updateEntryFieldLocalized,
  filterEntriesByNumericSearch,
  isNumericSearch,
} from './utils/entryUtils';
import { API_LIMITS, BATCH_FETCHING, BATCH_PROCESSING, PAGE_SIZE_OPTIONS } from './utils/constants';
import { ErrorNote } from './components/ErrorNote';
import FilterMultiselect from './components/FilterMultiselect';
import { EmptyEntryBanner } from './components/EmptyEntryBanner';

const getFieldsMapped = (fields: ContentTypeField[]) => {
  return fields.map((field) => ({
    label: field.locale ? `(${field.locale}) ${field.name}` : field.name,
    value: field.uniqueId,
  }));
};

const getStatusesMapped = (): FilterOption[] => {
  return getStatusesOptions().map((s) => ({ label: s, value: s.toLowerCase() }));
};

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
  const [selectedColumns, setSelectedColumns] = useState<FilterOption[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<FilterOption[]>(getStatusesMapped);
  const [currentContentType, setCurrentContentType] = useState<ContentTypeProps | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [initialTotal, setInitialTotal] = useState(0);

  const hasActiveFilters = () => {
    const hasSearchQuery = searchQuery.trim() !== '';
    const hasStatusFilter = selectedStatuses.length !== getStatusesMapped().length;
    const hasColumnFilter = selectedColumns.length !== getFieldsMapped(fields).length;
    return hasSearchQuery || hasStatusFilter || hasColumnFilter;
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStatuses(getStatusesMapped());
    setSelectedColumns(getFieldsMapped(fields));
    setActivePage(0);
  };

  const shouldDisableFilters = () => {
    return (entries.length === 0 && initialTotal === 0) || !selectedContentType || entriesLoading;
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

  const getOrder = (sortOption: string, displayField: string | null) => {
    if (sortOption === 'updatedAt_desc') return '-sys.updatedAt';
    else if (sortOption === 'updatedAt_asc') return 'sys.updatedAt';
    else if (displayField === null) return undefined;
    else if (sortOption === 'displayName_asc') return `fields.${displayField}`;
    else if (sortOption === 'displayName_desc') return `-fields.${displayField}`;
  };

  const getStatusFilter = (statusLabels: string[]) => {
    // If no statuses selected, return a filter that matches nothing
    if (statusLabels.length === 0) {
      return { 'sys.id[in]': 'nonexistent-id' };
    }

    const { hasDraft, hasPublished, hasChanged } = getStatusFlags(statusLabels);

    // Single status filtering
    if (hasDraft && statusLabels.length === 1) {
      return { 'sys.publishedAt[exists]': false };
    }

    if (!hasDraft && (hasPublished || hasChanged)) {
      return { 'sys.publishedAt[exists]': true, 'sys.archivedAt[exists]': false };
    }

    // Other combinations does not filter anything
    return {};
  };

  // We cannot differentiate throw the query changed and published
  const filterEntriesByStatus = (entries: EntryProps[], statusLabels: string[]): EntryProps[] => {
    // If no statuses selected, return empty array
    if (statusLabels.length === 0) return [];

    // If all statuses selected, return all entries
    if (statusLabels.length === 3) return entries;

    return entries.filter((entry) => {
      const entryStatus = getStatusFromEntry(entry);
      return statusLabels.includes(entryStatus);
    });
  };

  function needsClientFiltering() {
    const statusLabels = selectedStatuses.map((status) => status.label);
    const { hasDraft, hasPublished, hasChanged } = getStatusFlags(statusLabels);

    // If we need client-side filtering, fetch all entries
    return (
      (selectedStatuses.length > 0 &&
        ((hasDraft && (hasPublished || hasChanged)) || (hasPublished && hasChanged))) ||
      isNumericSearch(searchQuery)
    );
  }

  const buildQuery = (
    sortOption: string,
    displayField: string | null,
    statusLabels: string[],
    fetchAll: boolean = false
  ): QueryOptions => {
    const query: QueryOptions = {
      content_type: selectedContentTypeId,
      order: getOrder(sortOption, displayField),
      skip: fetchAll || needsClientFiltering() ? 0 : activePage * itemsPerPage,
      limit: fetchAll || needsClientFiltering() ? 1000 : itemsPerPage,
      ...getStatusFilter(statusLabels),
    };

    if (searchQuery.trim()) {
      query.query = searchQuery.trim();
    }

    return query;
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
  }, []);

  const clearBasicState = () => {
    setEntries([]);
    setFields([]);
    setTotalEntries(0);
    setInitialTotal(0);
  };

  // Fetch content type and fields when selectedContentTypeId changes
  useEffect(() => {
    const fetchContentTypeAndFields = async (): Promise<void> => {
      if (!selectedContentTypeId) {
        clearBasicState();
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
        setSelectedColumns(getFieldsMapped(newFields));
        setCurrentContentType(ct);
      } catch (e) {
        clearBasicState();
        setSelectedColumns([]);
        setCurrentContentType(null);
      }
    };
    void fetchContentTypeAndFields();
  }, [sdk, selectedContentTypeId]);

  // Fetch entries when pagination, sorting, or content type changes
  useEffect(() => {
    const fetchEntries = async (): Promise<void> => {
      if (fields.length === 0 || !currentContentType) {
        return;
      }
      setEntriesLoading(true);
      try {
        const displayField = currentContentType.displayField || null;
        const statusLabels = selectedStatuses.map((status) => status.label);

        const baseQuery = buildQuery(sortOption, displayField, statusLabels);

        const { entries, total } = await fetchEntriesWithBatching(
          sdk,
          baseQuery,
          baseQuery.limit || BATCH_FETCHING.DEFAULT_BATCH_SIZE
        );

        // Apply client-side status filtering
        const statusFilteredEntries = filterEntriesByStatus(entries, statusLabels);

        let searchFilteredEntries;
        if (!searchQuery.trim() || !isNumericSearch(searchQuery)) {
          searchFilteredEntries = entries;
        } else {
          searchFilteredEntries = filterEntriesByNumericSearch(
            statusFilteredEntries,
            searchQuery,
            fields,
            defaultLocale
          );
        }

        if (needsClientFiltering()) {
          // Client-side pagination
          const startIndex = activePage * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedEntries = searchFilteredEntries.slice(startIndex, endIndex);

          setEntries(paginatedEntries);
          setTotalEntries(searchFilteredEntries.length);
        } else {
          // Server-side pagination
          setEntries(searchFilteredEntries);
          setTotalEntries(total);
        }

        // Determine empty state type
        if (initialTotal === 0 && total > 0) {
          setInitialTotal(total);
        }
      } catch (e) {
        clearBasicState();
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
  ]);

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
    <Flex style={{ overflow: 'hidden' }}>
      <Box style={styles.mainContent} paddingY="spacingL" paddingLeft="spacingL">
        <Box style={{ ...styles.whiteBox, minWidth: 0 }} paddingTop="spacingL">
          <Flex style={{ minWidth: 0 }}>
            <ContentTypeSidebar
              contentTypes={contentTypes}
              selectedContentTypeId={selectedContentTypeId}
              onContentTypeSelect={(newCT) => {
                setSelectedContentTypeId(newCT);
                setSortOption(SORT_OPTIONS[0].value);
                setSelectedStatuses(getStatusesMapped);
                setActivePage(0);
                setSearchQuery('');
                setInitialTotal(0);
              }}
              disabled={entriesLoading}
            />
            <div style={styles.spacer} />
            <Box style={styles.tableContainer}>
              <>
                {/* Heading */}
                <Heading style={styles.pageHeader}>
                  {selectedContentType ? `Bulk edit ${selectedContentType.name}` : 'Bulk Edit App'}
                </Heading>

                {/* Search Section */}
                <SearchBar
                  searchQuery={searchQuery}
                  onSearchChange={(query) => {
                    setSearchQuery(query);
                    setActivePage(0);
                  }}
                  isDisabled={shouldDisableFilters()}
                  debounceDelay={300}
                />

                {/* Multiselects Filters Section */}
                <Flex gap="spacingS" alignItems="center">
                  <SortMenu
                    sortOption={sortOption}
                    onSortChange={(newSort) => {
                      setSortOption(newSort);
                      setActivePage(0);
                    }}
                    disabled={shouldDisableFilters()}
                  />
                  <FilterMultiselect
                    id="status"
                    options={getStatusesMapped()}
                    selectedItems={selectedStatuses}
                    setSelectedItems={(statuses) => {
                      setSelectedStatuses(statuses);
                      setActivePage(0);
                    }}
                    disabled={shouldDisableFilters()}
                    placeholderConfig={{
                      noneSelected: 'No statuses selected',
                      allSelected: 'Filter by status',
                    }}
                    style={styles.columnMultiselectStatuses}
                  />
                  <FilterMultiselect
                    id="column"
                    options={getFieldsMapped(fields)}
                    selectedItems={selectedColumns}
                    setSelectedItems={(selectedColumns) => {
                      setSelectedColumns(selectedColumns);
                      setActivePage(0);
                    }}
                    disabled={shouldDisableFilters()}
                    placeholderConfig={{
                      noneSelected: 'No fields selected',
                      allSelected: 'Filter fields',
                    }}
                    style={styles.columnMultiselectColumns}
                  />
                  {hasActiveFilters() && (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={resetFilters}
                      isDisabled={shouldDisableFilters()}
                      style={styles.resetFiltersButton}>
                      Reset filters
                    </Button>
                  )}
                </Flex>
                {!entriesLoading && (
                  <Flex alignItems="center" gap="spacingS" style={styles.editButton}>
                    <Button
                      variant="primary"
                      onClick={() => setIsModalOpen(true)}
                      isDisabled={!selectedField || selectedEntryIds.length === 0}>
                      {selectedEntryIds.length > 1 ? 'Bulk edit' : 'Edit'}
                    </Button>
                    <Text fontColor="gray600">
                      {selectedEntryIds.length || 'No'} entry field
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
                    {entries.length === 0 || !selectedContentType ? (
                      <EmptyEntryBanner
                        hasEntries={entries.length > 0}
                        hasInitialEntries={initialTotal > 0}
                      />
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
