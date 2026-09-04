import { useEffect, useState, useRef } from 'react';
import { Heading, Paragraph, Box, Note, Spinner, Flex, Text } from '@contentful/f36-components';
import { useSDK, useCMA } from '@contentful/react-apps-toolkit';
import type { PageAppSDK } from '@contentful/app-sdk';
import { ExportForm, type ExportFormData } from '../components/ExportForm';
import { ResultsList } from '../components/ResultsList';
import { Exporter, type ExportProgress } from '../lib/exporter';
import { getEntryCount } from '../lib/paginate';
import { buildQuery, getStatusPostFilter, type EntryStatus } from '../lib/queryBuilder';
import type { ContentType, Entry } from '../lib/flatten';

interface Locale {
  code: string;
  name: string;
}

interface Tag {
  sys: { id: string };
  name: string;
}

interface Concept {
  sys: { id: string };
  prefLabel: Record<string, string>;
}

interface SearchResult {
  sys: {
    id: string;
    contentType: {
      sys: {
        id: string;
      };
    };
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
  };
  fields?: Record<string, Record<string, unknown>>;
}

interface CmaUser {
  sys: { id: string };
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface CmaWithExtras {
  concept: { getMany: (opts: { query: Record<string, unknown> }) => Promise<{ items: Concept[] }> };
  user: { getManyForSpace: (opts: { spaceId: string }) => Promise<{ items: CmaUser[] }> };
}

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const cma = useCMA();

  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [locales, setLocales] = useState<Locale[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [estimatedCount, setEstimatedCount] = useState<number | null>(null);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState<Record<string, unknown> | null>(null);
  const [activePage, setActivePage] = useState(0);
  const ITEMS_PER_PAGE = 50;
  const [lastFormData, setLastFormData] = useState<ExportFormData | null>(null);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [selectAllMatching, setSelectAllMatching] = useState(false);
  const [excludedFieldIds, setExcludedFieldIds] = useState<string[]>([]);
  const [contentTypeMap, setContentTypeMap] = useState<
    Record<string, { name: string; displayField?: string }>
  >({});
  const [contentTypeSchemaMap, setContentTypeSchemaMap] = useState<Record<string, ContentType>>({});
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [columnSort, setColumnSort] = useState<{
    column: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const exporterRef = useRef<Exporter | null>(null);

  /**
   * Translate the result-table SortColumn to the flat-row column name produced
   * by flatten.ts so the exporter can sort the downloaded file rows. For the
   * "name" sort there is no fixed column name (flatten.ts emits the display
   * field's name, e.g. "Title (en-US)"), so we resolve it from the selected
   * content type when possible and fall back to the Entry ID.
   */
  const buildSortByColumn = (
    contentTypeId: string | undefined
  ): { column: string; direction: 'asc' | 'desc' } | undefined => {
    if (!columnSort) return undefined;

    if (columnSort.column === 'name') {
      const ct = contentTypeId ? contentTypeSchemaMap[contentTypeId] : undefined;
      const displayFieldId = ct?.displayField;
      const displayField =
        displayFieldId && !excludedFieldIds.includes(displayFieldId)
          ? ct?.fields.find((f) => f.id === displayFieldId)
          : undefined;
      if (displayField) {
        const colName = displayField.localized
          ? `${displayField.name} (${locales[0]?.code ?? 'en-US'})`
          : displayField.name;
        return { column: colName, direction: columnSort.direction };
      }
      return { column: 'Entry ID', direction: columnSort.direction };
    }

    const fixed: Record<string, string> = {
      contentType: 'Content Type',
      updated: 'Updated',
      updatedBy: 'Last Updated By',
      status: 'Status',
    };
    const rowKey = fixed[columnSort.column];
    return rowKey ? { column: rowKey, direction: columnSort.direction } : undefined;
  };

  const previewSchema = lastFormData?.contentTypeId
    ? contentTypeSchemaMap[lastFormData.contentTypeId] ?? null
    : null;

  const exportFields = previewSchema
    ? previewSchema.fields.map((f) => f.id).filter((id) => !excludedFieldIds.includes(id))
    : undefined;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ctResponse, localesResponse] = await Promise.all([
          sdk.cma.contentType.getMany({ query: { limit: 1000 } }),
          sdk.cma.locale.getMany({ query: { limit: 100 } }),
        ]);

        const ctItems = (ctResponse.items as unknown as ContentType[]).sort((a, b) =>
          (a.name || a.sys.id).localeCompare(b.name || b.sys.id)
        );
        setContentTypes(ctItems);

        const ctMap: Record<string, { name: string; displayField?: string }> = {};
        const ctSchemaMap: Record<string, ContentType> = {};
        for (const ct of ctItems) {
          ctMap[ct.sys.id] = { name: ct.name || ct.sys.id, displayField: ct.displayField };
          ctSchemaMap[ct.sys.id] = ct;
        }
        setContentTypeMap(ctMap);
        setContentTypeSchemaMap(ctSchemaMap);

        setLocales(
          localesResponse.items.map((l: { code: string; name: string }) => ({
            code: l.code,
            name: l.name,
          }))
        );

        try {
          const tagsResponse = await sdk.cma.tag.getMany({ query: { limit: 1000 } });
          setTags(tagsResponse.items as unknown as Tag[]);
        } catch (error) {
          console.warn('Tags not available or error loading tags:', error);
          setTags([]);
        }

        if (import.meta.env.VITE_MOCK_CONCEPTS === 'true') {
          const { MOCK_CONCEPTS } = await import('../lib/mockConcepts');
          setConcepts(MOCK_CONCEPTS);
        } else {
          try {
            const cmaExtras = cma as unknown as CmaWithExtras;
            const conceptsResponse = await cmaExtras.concept.getMany({ query: { limit: 1000 } });
            setConcepts(conceptsResponse.items);
          } catch (error) {
            console.warn('Concepts/taxonomy not available:', error);
            setConcepts([]);
          }
        }

        try {
          const spaceId = sdk.ids.space;
          const cmaExtras = cma as unknown as CmaWithExtras;
          const usersResponse = await cmaExtras.user.getManyForSpace({ spaceId });
          const uMap: Record<string, string> = {};
          for (const user of usersResponse.items) {
            const firstName = user.firstName || '';
            const lastName = user.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim() || user.email || user.sys.id;
            uMap[user.sys.id] = fullName;
          }
          setUserMap(uMap);
        } catch (error) {
          console.warn('Unable to load users:', error);
          setUserMap({});
        }
      } catch (error) {
        sdk.notifier.error('Failed to load content types and locales');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sdk, cma]);

  const handleEstimate = async (data: ExportFormData) => {
    try {
      setEstimatedCount(null);

      const query = buildQuery({
        contentTypeId: data.contentTypeId,
        search: data.search,
        status: data.status,
        createdFrom: data.createdFrom,
        createdTo: data.createdTo,
        updatedFrom: data.updatedFrom,
        updatedTo: data.updatedTo,
        sort: data.sort,
        tags: data.tags,
        tagsMatchAll: data.tagsMatchAll,
        concepts: data.concepts,
        conceptsMatchAll: data.conceptsMatchAll,
        fieldFilters: data.fieldFilters,
      });

      const { content_type, ...filters } = query;
      const count = await getEntryCount(sdk.cma, content_type as string | undefined, filters);
      setEstimatedCount(count);
    } catch (error) {
      sdk.notifier.error('Failed to estimate entry count');
      console.error(error);
    }
  };

  const handleSearch = async (data: ExportFormData) => {
    try {
      setIsSearching(true);
      setSearchResults([]);
      setSelectedEntryIds([]);
      setSelectAllMatching(false);
      setActivePage(0);
      if (data.contentTypeId !== lastFormData?.contentTypeId) {
        setExcludedFieldIds([]);
      }
      setLastFormData(data);

      const query = buildQuery({
        contentTypeId: data.contentTypeId,
        search: data.search,
        status: data.status,
        createdFrom: data.createdFrom,
        createdTo: data.createdTo,
        updatedFrom: data.updatedFrom,
        updatedTo: data.updatedTo,
        sort: data.sort,
        tags: data.tags,
        tagsMatchAll: data.tagsMatchAll,
        concepts: data.concepts,
        conceptsMatchAll: data.conceptsMatchAll,
        fieldFilters: data.fieldFilters,
      });

      setLastSearchQuery(query);

      const response = await sdk.cma.entry.getMany({
        query: { ...query, limit: ITEMS_PER_PAGE, skip: 0 },
      });

      const postFilter = getStatusPostFilter(data.status as EntryStatus);
      const items = postFilter
        ? (response.items as unknown as SearchResult[]).filter(
            postFilter as (e: SearchResult) => boolean
          )
        : (response.items as unknown as SearchResult[]);

      setSearchResults(items);
      setEstimatedCount(response.items.length >= response.total ? items.length : response.total);

      setTimeout(() => {
        const resultsElement = document.querySelector('[data-results-list]');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (error) {
      sdk.notifier.error('Failed to search entries');
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleExportSelected = async (
    selectedIds: string[],
    format: 'csv' | 'json' | 'xlsx' | 'xml' | 'yaml' = 'csv',
    filename = ''
  ) => {
    try {
      setIsExporting(true);
      setProgress({
        fetched: 0,
        total: selectedIds.length,
        status: 'fetching',
        message: `Exporting ${selectedIds.length} selected entries...`,
      });

      const exporter = new Exporter(sdk.cma);
      exporterRef.current = exporter;

      // Fetch all selected entries in one API call using sys.id[in] instead of
      // per-entry requests, which avoids rate-limit issues at large selection sizes.
      const firstEntry = searchResults.find((r) => r.sys.id === selectedIds[0]);
      const contentTypeId = firstEntry?.sys.contentType.sys.id ?? '';

      await exporter.start(
        {
          contentType: contentTypes.find((ct) => ct.sys.id === contentTypeId) || null,
          contentTypeId: contentTypeId || 'selected',
          locales: lastFormData?.locales ?? locales.map((l) => l.code),
          fields: exportFields,
          userMap: userMap,
          contentTypeMap: contentTypeSchemaMap,
          format,
          filters: {
            'sys.id[in]': selectedIds.join(','),
          },
          filename,
          sortByColumn: buildSortByColumn(contentTypeId),
        },
        (newProgress) => {
          setProgress(newProgress);
        }
      );

      sdk.notifier.success(`Successfully exported ${selectedIds.length} selected entries!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      sdk.notifier.error(`Failed to export selected entries: ${message}`);
      console.error(error);
    } finally {
      setIsExporting(false);
      setProgress(null);
      exporterRef.current = null;
    }
  };

  const handlePageChange = async (page: number) => {
    if (!lastSearchQuery) return;

    try {
      setIsSearching(true);
      setActivePage(page);
      setSelectedEntryIds([]);
      setSelectAllMatching(false);

      const response = await sdk.cma.entry.getMany({
        query: { ...lastSearchQuery, limit: ITEMS_PER_PAGE, skip: page * ITEMS_PER_PAGE },
      });

      const postFilter = getStatusPostFilter(lastFormData?.status as EntryStatus);
      const items = postFilter
        ? (response.items as unknown as SearchResult[]).filter(
            postFilter as (e: SearchResult) => boolean
          )
        : (response.items as unknown as SearchResult[]);

      setSearchResults(items);
    } catch (error) {
      sdk.notifier.error('Failed to load results');
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleExport = async (data: ExportFormData) => {
    try {
      setLastFormData(data);
      setIsExporting(true);
      setProgress({
        fetched: 0,
        total: 0,
        status: 'estimating',
        message: 'Starting export...',
      });

      const query = buildQuery({
        contentTypeId: data.contentTypeId,
        search: data.search,
        status: data.status,
        createdFrom: data.createdFrom,
        createdTo: data.createdTo,
        updatedFrom: data.updatedFrom,
        updatedTo: data.updatedTo,
        sort: data.sort,
        tags: data.tags,
        tagsMatchAll: data.tagsMatchAll,
        concepts: data.concepts,
        conceptsMatchAll: data.conceptsMatchAll,
        fieldFilters: data.fieldFilters,
      });

      const { content_type, ...filters } = query;

      const exporter = new Exporter(sdk.cma);
      exporterRef.current = exporter;

      const exportStatusPostFilter = getStatusPostFilter(data.status as EntryStatus) ?? undefined;

      await exporter.start(
        {
          contentType: data.contentType,
          contentTypeId: data.contentTypeId || 'all-content-types',
          locales: data.locales,
          fields: exportFields,
          filters,
          userMap: userMap,
          contentTypeMap: contentTypeSchemaMap,
          format: data.format || 'csv',
          filename:
            data.customFilename ||
            (data.contentTypeId
              ? `${data.contentTypeId}-${new Date().toISOString().split('T')[0]}`
              : `contentful-export-${new Date().toISOString().split('T')[0]}`),
          sortByColumn: buildSortByColumn(data.contentTypeId),
          statusPostFilter: exportStatusPostFilter as ((entry: Entry) => boolean) | undefined,
        },
        (newProgress) => {
          setProgress(newProgress);
        }
      );

      if (progress?.status === 'complete') {
        sdk.notifier.success(`Export completed! Downloaded ${progress.fetched} entries.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      sdk.notifier.error(`Export failed: ${message}`);
      console.error(error);
    } finally {
      setIsExporting(false);
      exporterRef.current = null;
    }
  };

  // Exports every entry matching the current filters (not just the fetched page),
  // reusing the same filtered query the main "Export" flow uses so it scales to
  // any result size instead of requiring every ID to be collected client-side.
  const handleExportAllMatching = (
    format: 'csv' | 'json' | 'xlsx' | 'xml' | 'yaml',
    filename: string
  ) => {
    if (!lastFormData) return;
    handleExport({ ...lastFormData, format, customFilename: filename });
  };

  if (loading) {
    return (
      <Flex
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
        gap="spacingS"
        style={{ minHeight: '60vh' }}>
        <Spinner />
        <Text fontColor="gray600">Loading content types, locales, and tags...</Text>
      </Flex>
    );
  }

  return (
    <Box style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      <Flex flexDirection="column" alignItems="stretch" gap="spacingL" padding="spacingL">
        <Box style={{ width: '100%', maxWidth: '1040px' }}>
          <Heading marginBottom="spacingS">Content Exporter</Heading>
          <Paragraph marginBottom="none" style={{ maxWidth: '700px' }}>
            Search, preview, and export Contentful entries across one content type or the whole
            space. Use filters to narrow the result set, then export matching or selected entries.
          </Paragraph>
        </Box>

        {contentTypes.length === 0 && (
          <Note variant="warning" title="No content types found">
            Add content types to this space before running an export.
          </Note>
        )}

        <ExportForm
          contentTypes={contentTypes}
          availableLocales={locales}
          availableTags={tags}
          availableConcepts={concepts}
          onSubmit={handleExport}
          onEstimate={handleEstimate}
          onSearch={handleSearch}
          onQuickExport={handleExport}
          isExporting={isExporting}
          isSearching={isSearching}
          estimatedCount={estimatedCount}
          spaceId={sdk.ids.space}
        />

        {searchResults.length === 0 && !isSearching && !lastSearchQuery && (
          <Box
            style={{
              textAlign: 'center',
              padding: '48px 24px',
            }}>
            <Text fontColor="gray500">List results to export will appear here.</Text>
          </Box>
        )}

        {searchResults.length === 0 && !isSearching && lastSearchQuery && (
          <Box style={{ textAlign: 'center', padding: '48px 24px' }}>
            <Text
              fontWeight="fontWeightDemiBold"
              marginBottom="spacingXs"
              style={{ display: 'block' }}>
              No results.
            </Text>
            <Text fontColor="gray600">Try adjusting your filters and generating a list again.</Text>
          </Box>
        )}

        <ResultsList
          results={searchResults}
          loading={isSearching}
          onPageChange={handlePageChange}
          activePage={activePage}
          itemsPerPage={ITEMS_PER_PAGE}
          totalCount={estimatedCount ?? undefined}
          selectedIds={selectedEntryIds}
          onSelectionChange={setSelectedEntryIds}
          onExportSelected={handleExportSelected}
          selectAllMatching={selectAllMatching}
          onSelectAllMatchingChange={setSelectAllMatching}
          onExportAllMatching={handleExportAllMatching}
          contentTypeMap={contentTypeMap}
          userMap={userMap}
          spaceId={sdk.ids.space}
          environmentId={sdk.ids.environment}
          isExporting={isExporting}
          exportProgress={progress}
          onSortChange={setColumnSort}
          contentTypeSchema={previewSchema}
          excludedFieldIds={excludedFieldIds}
          onExcludedFieldIdsChange={setExcludedFieldIds}
          locales={lastFormData?.locales ?? []}
        />
      </Flex>
    </Box>
  );
};

export default Page;
