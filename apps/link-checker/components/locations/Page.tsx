import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Note,
  Option,
  Paragraph,
  Select,
  Spinner,
  Table,
  Text,
  TextInput,
  TextLink,
} from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { normalizeDomainPattern, urlMatchesAnyDomainPattern } from '@/utils/domainPatterns';
import { extractUrlsFromEntry, isRelativeUrl, type ExtractedUrl } from '@/utils/extractUrls';
import { type AppInstallationParameters } from './ConfigScreen';

const CHECK_LINK_FUNCTION_ID = 'checkLink';
const FETCH_LIMIT = 1000;
const ENTRY_FETCH_LIMIT = 100;
const CHECK_CONCURRENCY = 5;
const SUPPORTED_FIELD_TYPES = ['Symbol', 'Text', 'RichText'];

type LinkStatus = 'valid' | 'invalid' | 'unchecked' | 'checking';

interface ContentTypeSummary {
  id: string;
  name: string;
  displayField?: string;
  fields: Array<{
    id: string;
    name: string;
    type: string;
    items?: {
      type?: string;
    };
  }>;
}

interface EntrySummary {
  sys: {
    id: string;
    contentType: { sys: { id: string } };
  };
  fields: Record<string, Record<string, unknown>>;
}

interface PageLinkResult {
  id: string;
  entryId: string;
  entryTitle: string;
  entryUrl: string;
  contentTypeId: string;
  contentTypeName: string;
  fieldId: string;
  fieldName: string;
  locale: string;
  url: string;
  resolvedUrl?: string;
  status: LinkStatus;
  statusCode?: number;
  reason?: string;
}

function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

function getEntryTitle(
  entry: EntrySummary,
  contentType: ContentTypeSummary | undefined,
  defaultLocale: string
): string {
  const displayField = contentType?.displayField;
  const value = displayField ? entry.fields?.[displayField]?.[defaultLocale] : undefined;
  if (typeof value === 'string' && value.trim()) return value.trim();
  return 'Untitled';
}

function getEntryUrl(spaceId: string, environmentId: string, entryId: string): string {
  return `https://app.contentful.com/spaces/${spaceId}/environments/${environmentId}/entries/${entryId}`;
}

function buildExtractableEntry(entry: EntrySummary, contentType: ContentTypeSummary) {
  const fields = Object.fromEntries(
    contentType.fields
      .filter((field) => {
        if (SUPPORTED_FIELD_TYPES.includes(field.type)) return true;
        return field.type === 'Array' && SUPPORTED_FIELD_TYPES.includes(field.items?.type || '');
      })
      .map((field) => {
        const localizedValues = entry.fields?.[field.id] || {};
        return [
          field.id,
          {
            id: field.id,
            name: field.name || field.id,
            type: field.type === 'Array' ? field.items?.type || field.type : field.type,
            locales: Object.keys(localizedValues),
            getValue: (locale?: string) => {
              if (!locale) return undefined;
              return localizedValues[locale];
            },
          },
        ];
      })
  );

  return { fields };
}

function StatusBadge({ result }: { result: PageLinkResult }) {
  if (result.status === 'checking') {
    return <Badge variant="primary">{result.reason ?? 'Checking'}</Badge>;
  }

  if (result.status === 'valid') {
    return <Badge variant="positive">{result.statusCode ?? 'Valid'}</Badge>;
  }

  if (result.status === 'invalid') {
    return <Badge variant="negative">{result.reason ?? result.statusCode ?? 'Invalid'}</Badge>;
  }

  return <Badge variant="warning">{result.reason ?? "Couldn't validate"}</Badge>;
}

function sortResults(results: PageLinkResult[]) {
  const rank: Record<LinkStatus, number> = { invalid: 0, checking: 1, unchecked: 2, valid: 3 };

  return [...results].sort((left, right) => {
    if (left.status !== right.status) {
      return rank[left.status] - rank[right.status];
    }

    return left.url.localeCompare(right.url);
  });
}

export default function Page() {
  const sdk = useSDK<PageAppSDK>();
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PageLinkResult[]>([]);
  const [progress, setProgress] = useState<{ checked: number; total: number } | null>(null);
  const [scanStats, setScanStats] = useState<{ entriesScanned: number; linksFound: number }>({
    entriesScanned: 0,
    linksFound: 0,
  });
  const [configuredContentTypes, setConfiguredContentTypes] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [hasStartedScan, setHasStartedScan] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LinkStatus>('all');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [scanNotice, setScanNotice] = useState<string | null>(null);

  const installation = (sdk.parameters.installation || {}) as AppInstallationParameters;
  const hasAssignedContentTypes = Boolean(installation.selectedContentTypeIds?.length);
  const explicitAllowedPatterns = (installation.allowedUrlPatterns || '')
    .split(',')
    .map((p) => normalizeDomainPattern(p))
    .filter(Boolean);
  const forbiddenPatterns = (installation.forbiddenUrlPatterns || '')
    .split(',')
    .map((p) => normalizeDomainPattern(p))
    .filter(Boolean);
  const baseUrl = (installation.baseUrl || '').trim().replace(/\/$/, '') || null;
  const allowedPatterns = explicitAllowedPatterns;

  const loadAuditResults = useCallback(async () => {
    setError(null);
    setScanNotice(null);
    setLoading(true);
    setScanning(false);
    setProgress(null);
    setResults([]);
    setScanStats({ entriesScanned: 0, linksFound: 0 });

    try {
      const currentState = await (
        sdk as PageAppSDK & {
          app?: { getCurrentState: () => Promise<{ EditorInterface?: Record<string, unknown> }> };
        }
      ).app?.getCurrentState?.();
      const configuredContentTypeIds = installation.selectedContentTypeIds?.length
        ? installation.selectedContentTypeIds
        : Object.keys(currentState?.EditorInterface ?? {});

      const fetchAllContentTypes = async (): Promise<ContentTypeSummary[]> => {
        const items: ContentTypeSummary[] = [];
        let skip = 0;

        while (true) {
          const response = await sdk.cma.contentType.getMany({
            spaceId: sdk.ids.space,
            environmentId: sdk.ids.environment,
            query: { skip, limit: FETCH_LIMIT },
          });

          items.push(
            ...response.items.map((contentType: any) => ({
              id: contentType.sys.id,
              name: contentType.name,
              displayField: contentType.displayField,
              fields: contentType.fields || [],
            }))
          );
          if (!response.items || response.items.length < FETCH_LIMIT) break;
          skip += FETCH_LIMIT;
        }

        const filteredItems = items.filter((contentType) =>
          configuredContentTypeIds.includes(contentType.id)
        );

        return filteredItems.sort((a, b) => a.name.localeCompare(b.name));
      };

      const contentTypes = await fetchAllContentTypes();
      setConfiguredContentTypes(
        contentTypes.map((contentType) => ({ id: contentType.id, name: contentType.name }))
      );

      if (configuredContentTypeIds.length === 0) {
        setLoading(false);
        setResults([]);
        return;
      }

      const contentTypeMap = new Map(
        contentTypes
          .filter((contentType) =>
            contentType.fields.some((field) => {
              if (SUPPORTED_FIELD_TYPES.includes(field.type)) return true;
              return (
                field.type === 'Array' && SUPPORTED_FIELD_TYPES.includes(field.items?.type || '')
              );
            })
          )
          .map((contentType) => [contentType.id, contentType])
      );

      if (contentTypeMap.size === 0) {
        setResults([]);
        setLoading(false);
        setScanNotice(
          'The assigned content types do not contain any supported Symbol, Text, Rich Text, or matching list fields.'
        );
        return;
      }

      const appDefinitionId = sdk.ids.app;

      if (!appDefinitionId) {
        setResults([]);
        setLoading(false);
        setError('The page view could not determine the current app definition.');
        return;
      }

      let resolvedActionId: string | null = null;
      if (sdk.cma?.appAction?.getMany) {
        try {
          const { items } = await sdk.cma.appAction.getMany({
            organizationId: sdk.ids.organization,
            appDefinitionId,
          });

          const matchingAction = items?.find((action: any) => {
            const functionId = action.function?.sys?.id;
            const actionAppDefinitionId =
              action.sys?.appDefinition?.sys?.id ?? action.sys?.appDefinition?.id;
            return (
              functionId === CHECK_LINK_FUNCTION_ID && actionAppDefinitionId === appDefinitionId
            );
          });

          if (matchingAction?.sys?.id) {
            resolvedActionId = matchingAction.sys.id;
          }
        } catch {
          // Fall back to the manifest action id below if the lookup request fails.
        }
      }

      // Fall back to the manifest action id when the SDK lookup does not return an item.
      resolvedActionId ||= CHECK_LINK_FUNCTION_ID;

      if (!resolvedActionId || !sdk.cma?.appActionCall?.createWithResponse) {
        setResults([]);
        setLoading(false);
        setError('The page view could not find the configured App Action for link checking.');
        return;
      }

      const actionId = resolvedActionId;
      const resultMap = new Map<string, PageLinkResult>();
      const pendingChecks: Array<{
        entryId: string;
        entryTitle: string;
        entryUrl: string;
        contentTypeId: string;
        contentTypeName: string;
        extractedUrl: ExtractedUrl;
        resolvedUrl?: string;
        urlToCheck: string;
      }> = [];
      const requestCache = new Map<string, Promise<{ status?: number; error?: string }>>();

      const runRequest = (urlToCheck: string) => {
        const existing = requestCache.get(urlToCheck);
        if (existing) return existing;

        const request: Promise<{ status?: number; error?: string }> = sdk.cma.appActionCall
          .createWithResponse(
            {
              spaceId: sdk.ids.space,
              environmentId: sdk.ids.environment,
              appDefinitionId,
              appActionId: actionId,
            },
            { parameters: { url: urlToCheck } }
          )
          .then((response) => {
            const body = (response as { response?: { body?: string } })?.response?.body;
            if (!body) return {};
            try {
              return JSON.parse(body) as { status?: number; error?: string };
            } catch {
              return { error: 'Invalid response body' };
            }
          })
          .catch((requestError: unknown) => {
            return {
              error: requestError instanceof Error ? requestError.message : 'Request failed',
            };
          });

        requestCache.set(urlToCheck, request);
        return request;
      };

      let skip = 0;
      let hasLoadedFirstBatch = false;
      let entriesScanned = 0;
      let linksFound = 0;
      const entryQueryBase = {
        'sys.contentType.sys.id[in]': Array.from(contentTypeMap.keys()).join(','),
      };

      while (true) {
        const response = await sdk.cma.entry.getMany({
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
          query: {
            skip,
            limit: ENTRY_FETCH_LIMIT,
            ...entryQueryBase,
          },
        });

        const batchEntries = response.items as EntrySummary[];

        for (const entry of batchEntries) {
          const contentType = contentTypeMap.get(entry.sys.contentType.sys.id);
          if (!contentType) continue;

          const extractableEntry = buildExtractableEntry(entry, contentType);
          const extractedUrls = extractUrlsFromEntry(extractableEntry);
          entriesScanned += 1;
          linksFound += extractedUrls.length;
          const entryTitle = getEntryTitle(entry, contentType, sdk.locales.default);
          const entryUrl = getEntryUrl(sdk.ids.space, sdk.ids.environment, entry.sys.id);

          for (const extractedUrl of extractedUrls) {
            const resultId = `${entry.sys.id}-${extractedUrl.fieldId}-${extractedUrl.locale}-${extractedUrl.url}`;

            if (isRelativeUrl(extractedUrl.url)) {
              if (!baseUrl) {
                resultMap.set(resultId, {
                  id: resultId,
                  entryId: entry.sys.id,
                  entryTitle,
                  entryUrl,
                  contentTypeId: contentType.id,
                  contentTypeName: contentType.name,
                  fieldId: extractedUrl.fieldId,
                  fieldName: extractedUrl.fieldName,
                  locale: extractedUrl.locale,
                  url: extractedUrl.url,
                  status: 'unchecked',
                  reason: 'Needs current domain',
                });
                continue;
              }

              try {
                const resolvedUrl = new URL(
                  extractedUrl.url,
                  baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`
                ).href;

                pendingChecks.push({
                  entryId: entry.sys.id,
                  entryTitle,
                  entryUrl,
                  contentTypeId: contentType.id,
                  contentTypeName: contentType.name,
                  extractedUrl,
                  resolvedUrl,
                  urlToCheck: resolvedUrl,
                });

                resultMap.set(resultId, {
                  id: resultId,
                  entryId: entry.sys.id,
                  entryTitle,
                  entryUrl,
                  contentTypeId: contentType.id,
                  contentTypeName: contentType.name,
                  fieldId: extractedUrl.fieldId,
                  fieldName: extractedUrl.fieldName,
                  locale: extractedUrl.locale,
                  url: extractedUrl.url,
                  resolvedUrl,
                  status: 'checking',
                  reason: 'Checking',
                });
              } catch {
                resultMap.set(resultId, {
                  id: resultId,
                  entryId: entry.sys.id,
                  entryTitle,
                  entryUrl,
                  contentTypeId: contentType.id,
                  contentTypeName: contentType.name,
                  fieldId: extractedUrl.fieldId,
                  fieldName: extractedUrl.fieldName,
                  locale: extractedUrl.locale,
                  url: extractedUrl.url,
                  status: 'unchecked',
                  reason: 'Invalid relative link',
                });
              }

              continue;
            }

            pendingChecks.push({
              entryId: entry.sys.id,
              entryTitle,
              entryUrl,
              contentTypeId: contentType.id,
              contentTypeName: contentType.name,
              extractedUrl,
              urlToCheck: extractedUrl.url,
            });

            resultMap.set(resultId, {
              id: resultId,
              entryId: entry.sys.id,
              entryTitle,
              entryUrl,
              contentTypeId: contentType.id,
              contentTypeName: contentType.name,
              fieldId: extractedUrl.fieldId,
              fieldName: extractedUrl.fieldName,
              locale: extractedUrl.locale,
              url: extractedUrl.url,
              status: 'checking',
              reason: 'Checking',
            });
          }
        }

        if (!hasLoadedFirstBatch) {
          setLoading(false);
          hasLoadedFirstBatch = true;
        }

        setScanStats({ entriesScanned, linksFound });
        setResults(sortResults(Array.from(resultMap.values())));

        if (!response.items || response.items.length < ENTRY_FETCH_LIMIT) {
          break;
        }

        skip += ENTRY_FETCH_LIMIT;
      }

      if (!hasLoadedFirstBatch) {
        setLoading(false);
      }

      if (pendingChecks.length === 0) {
        setScanning(false);
        setProgress(null);
        return;
      }

      setScanning(true);
      setProgress({ checked: 0, total: pendingChecks.length });

      const queue = [...pendingChecks];
      let checkedCount = 0;

      const workers = Array.from({ length: CHECK_CONCURRENCY }, async () => {
        while (queue.length > 0) {
          const item = queue.shift();
          if (!item) break;

          const resultId = `${item.entryId}-${item.extractedUrl.fieldId}-${item.extractedUrl.locale}-${item.extractedUrl.url}`;
          let nextResult: PageLinkResult;

          if (
            allowedPatterns.length > 0 &&
            !urlMatchesAnyDomainPattern(item.urlToCheck, allowedPatterns)
          ) {
            nextResult = {
              id: resultId,
              entryId: item.entryId,
              entryTitle: item.entryTitle,
              entryUrl: item.entryUrl,
              contentTypeId: item.contentTypeId,
              contentTypeName: item.contentTypeName,
              fieldId: item.extractedUrl.fieldId,
              fieldName: item.extractedUrl.fieldName,
              locale: item.extractedUrl.locale,
              url: item.extractedUrl.url,
              resolvedUrl: item.resolvedUrl,
              status: 'invalid',
              reason: 'Not on allow list',
            };
          } else if (urlMatchesAnyDomainPattern(item.urlToCheck, forbiddenPatterns)) {
            nextResult = {
              id: resultId,
              entryId: item.entryId,
              entryTitle: item.entryTitle,
              entryUrl: item.entryUrl,
              contentTypeId: item.contentTypeId,
              contentTypeName: item.contentTypeName,
              fieldId: item.extractedUrl.fieldId,
              fieldName: item.extractedUrl.fieldName,
              locale: item.extractedUrl.locale,
              url: item.extractedUrl.url,
              resolvedUrl: item.resolvedUrl,
              status: 'invalid',
              reason: 'On deny list',
            };
          } else {
            const response = await runRequest(item.urlToCheck);
            const status = 'status' in response ? response.status : undefined;

            nextResult = {
              id: resultId,
              entryId: item.entryId,
              entryTitle: item.entryTitle,
              entryUrl: item.entryUrl,
              contentTypeId: item.contentTypeId,
              contentTypeName: item.contentTypeName,
              fieldId: item.extractedUrl.fieldId,
              fieldName: item.extractedUrl.fieldName,
              locale: item.extractedUrl.locale,
              url: item.extractedUrl.url,
              resolvedUrl: item.resolvedUrl,
              status: typeof status === 'number' && isSuccessStatus(status) ? 'valid' : 'invalid',
              statusCode: status,
              reason: response.error,
            };
          }

          resultMap.set(resultId, nextResult);
          checkedCount += 1;
          setProgress({ checked: checkedCount, total: pendingChecks.length });
          setResults(sortResults(Array.from(resultMap.values())));
        }
      });

      await Promise.all(workers);
      setScanning(false);
      setProgress(null);
    } catch (loadError) {
      console.error('Failed to load Link Checker page audit:', loadError);
      setLoading(false);
      setScanning(false);
      setProgress(null);
      setError('The page view could not finish scanning links for this space.');
    }
  }, [sdk, allowedPatterns, forbiddenPatterns, baseUrl, installation.selectedContentTypeIds]);

  const contentTypeOptions = useMemo(() => {
    return configuredContentTypes;
  }, [configuredContentTypes]);

  useEffect(() => {
    if (contentTypeFilter === 'all') return;
    if (!contentTypeOptions.some((option) => option.id === contentTypeFilter)) {
      setContentTypeFilter('all');
    }
  }, [contentTypeFilter, contentTypeOptions]);

  const filteredResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return results.filter((result) => {
      if (statusFilter !== 'all' && result.status !== statusFilter) return false;
      if (contentTypeFilter !== 'all' && result.contentTypeId !== contentTypeFilter) return false;

      if (!normalizedQuery) return true;

      const haystack = [
        result.url,
        result.entryTitle,
        result.contentTypeName,
        result.fieldName,
        result.locale,
        result.reason || '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [contentTypeFilter, query, results, statusFilter]);

  const counts = useMemo(() => {
    return results.reduce(
      (acc, result) => {
        acc[result.status] += 1;
        return acc;
      },
      { valid: 0, invalid: 0, unchecked: 0, checking: 0 }
    );
  }, [results]);

  const refreshResults = async () => {
    setHasStartedScan(true);
    setRefreshing(true);
    await loadAuditResults();
    setRefreshing(false);
  };

  return (
    <Flex justifyContent="center" paddingLeft="spacingL" paddingRight="spacingL">
      <Box
        style={{ width: '100%', maxWidth: '1280px' }}
        paddingTop="spacingL"
        paddingBottom="spacing2Xl">
        <Flex
          alignItems="flex-start"
          justifyContent="space-between"
          gap="spacingL"
          marginBottom="spacingL">
          <Box>
            <Heading>Link Checker</Heading>
            <Paragraph marginTop="spacingXs" marginBottom="none">
              Search and filter links across the space, then jump straight to the entry that needs
              an update.
            </Paragraph>
          </Box>
          <Button
            variant="secondary"
            onClick={refreshResults}
            isLoading={refreshing || loading}
            isDisabled={!loading && !hasAssignedContentTypes && hasStartedScan}>
            {hasStartedScan ? 'Refresh links' : 'Run scan'}
          </Button>
        </Flex>

        {!baseUrl && (
          <Note variant="warning" title="Current domain not configured">
            Relative links will appear as unchecked until you set <strong>Current domain</strong> in
            the app configuration.
          </Note>
        )}

        {error && (
          <Box marginTop="spacingL">
            <Note variant="negative" title="Could not load the link audit">
              {error}
            </Note>
          </Box>
        )}

        {!error && scanNotice && (
          <Box marginTop="spacingL">
            <Note variant="neutral" title="Nothing to scan">
              {scanNotice}
            </Note>
          </Box>
        )}

        <>
          {!hasStartedScan && (
            <Box marginTop="spacingL" marginBottom="spacingL">
              {hasAssignedContentTypes ? (
                <Note variant="primary" title="Run a scan when you are ready">
                  Scan only the content types assigned to Link Checker and populate the table batch
                  by batch.
                </Note>
              ) : (
                <Note variant="warning" title="Assign content types first">
                  The page audit only scans content types selected in the app configuration. Assign
                  at least one content type there, then come back here to run a scan.
                </Note>
              )}
            </Box>
          )}

          {loading && hasStartedScan && results.length === 0 && (
            <Box marginTop="spacingL" marginBottom="spacingL">
              <Note variant="primary" title="Loading first results">
                Loading entries and extracting links. The table will appear as soon as the first
                batch is ready.
              </Note>
            </Box>
          )}
          <Flex gap="spacingS" flexWrap="wrap" marginTop="spacingL" marginBottom="spacingL">
            <Badge variant="primary">{counts.checking} checking</Badge>
            <Badge variant="negative">{counts.invalid} invalid</Badge>
            <Badge variant="positive">{counts.valid} valid</Badge>
            <Badge variant="secondary">{results.length} total</Badge>
          </Flex>

          {scanning && progress && (
            <Box marginBottom="spacingL">
              <Note variant="primary" title="Link scan in progress">
                Scanned {scanStats.entriesScanned} entries and found {scanStats.linksFound} links so
                far. Checked {progress.checked} of {progress.total} links. Results are updating as
                they come in.
              </Note>
            </Box>
          )}

          <Flex gap="spacingS" flexWrap="wrap" marginBottom="spacingL" alignItems="flex-end">
            <Box style={{ minWidth: '260px', flex: '1 1 320px' }}>
              <TextInput
                name="link-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by URL, entry, content type, field, or reason"
              />
            </Box>
            <Box style={{ minWidth: '180px' }}>
              <Select
                name="status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'all' | LinkStatus)}>
                <Option value="all">All statuses</Option>
                <Option value="checking">Checking</Option>
                <Option value="invalid">Invalid</Option>
                <Option value="valid">Valid</Option>
              </Select>
            </Box>
            <Box style={{ minWidth: '220px' }}>
              <Select
                name="content-type-filter"
                value={contentTypeFilter}
                onChange={(event) => setContentTypeFilter(event.target.value)}
                isDisabled={!hasAssignedContentTypes}>
                <Option value="all">All content types</Option>
                {contentTypeOptions.map((option) => (
                  <Option key={option.id} value={option.id}>
                    {option.name}
                  </Option>
                ))}
              </Select>
            </Box>
          </Flex>

          {filteredResults.length === 0 ? (
            <Note variant="neutral">
              {!hasStartedScan
                ? 'No scan has been run yet.'
                : !hasAssignedContentTypes
                ? 'No content types are assigned to Link Checker in the app configuration.'
                : loading
                ? `Preparing the first batch of links. ${scanStats.entriesScanned} entries scanned so far.`
                : 'No links match the current filters.'}
            </Note>
          ) : (
            <Box style={{ overflowX: 'auto' }}>
              <Table>
                <Table.Head>
                  <Table.Row>
                    <Table.Cell style={{ minWidth: '132px' }}>Status</Table.Cell>
                    <Table.Cell style={{ minWidth: '280px' }}>Link</Table.Cell>
                    <Table.Cell style={{ minWidth: '180px' }}>Content type</Table.Cell>
                    <Table.Cell style={{ minWidth: '240px' }}>Entry</Table.Cell>
                    <Table.Cell style={{ minWidth: '170px' }}>Field</Table.Cell>
                    <Table.Cell style={{ minWidth: '120px' }}>Locale</Table.Cell>
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {filteredResults.map((result) => (
                    <Table.Row key={result.id}>
                      <Table.Cell style={{ minWidth: '132px' }}>
                        <StatusBadge result={result} />
                      </Table.Cell>
                      <Table.Cell style={{ minWidth: '280px' }}>
                        <Flex flexDirection="column" alignItems="flex-start">
                          <TextLink
                            href={result.resolvedUrl ?? result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            {result.url}
                          </TextLink>
                          {result.resolvedUrl && result.resolvedUrl !== result.url && (
                            <Text fontSize="fontSizeS" fontColor="gray600">
                              Resolves to {result.resolvedUrl}
                            </Text>
                          )}
                        </Flex>
                      </Table.Cell>
                      <Table.Cell style={{ minWidth: '180px' }}>
                        {result.contentTypeName}
                      </Table.Cell>
                      <Table.Cell style={{ minWidth: '240px' }}>
                        <TextLink
                          href={result.entryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          icon={<ExternalLinkIcon />}
                          alignIcon="end">
                          {result.entryTitle}
                        </TextLink>
                      </Table.Cell>
                      <Table.Cell style={{ minWidth: '170px' }}>{result.fieldName}</Table.Cell>
                      <Table.Cell style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>
                        {result.locale}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </Box>
          )}
        </>
      </Box>
    </Flex>
  );
}
