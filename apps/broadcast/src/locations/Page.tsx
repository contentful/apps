import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  Flex,
  Grid,
  GridItem,
  Heading,
  Paragraph,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Text,
} from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import ProgressBar from '../components/ProgressBar';

type UsageMetricsSuccess = {
  status: string;
  character_count: number;
  character_limit: number;
  tier: string;
  next_character_count_reset_unix: number;
};

type UsageMetricsFailure = {
  status: 'error';
  code: 'PROVIDER_ERROR';
};

type UsageMetricsResult = UsageMetricsSuccess | UsageMetricsFailure;

type AppActionResult =
  | { ok: true; data: UsageMetricsResult }
  | { ok: false; errors?: Array<{ message: string }> };

const ACTION_NAME = 'Get Usage Metrics';
const LOG_CONTENT_TYPE_ID = 'broadcastAudioGenerationLog';

type GenerationLogFields = {
  entryId?: Record<string, string>;
  locale?: Record<string, string>;
  charCount?: Record<string, number>;
  voiceId?: Record<string, string>;
  success?: Record<string, boolean>;
  contentTypeId?: Record<string, string>;
  authorEntryId?: Record<string, string>;
  latencyMs?: Record<string, number>;
};

type GenerationLogEntry = {
  sys: {
    id: string;
    createdAt: string;
  };
  fields: GenerationLogFields;
};

type GenerationLogRecord = {
  id: string;
  createdAt: string;
  entryId?: string;
  locale?: string;
  charCount?: number;
  voiceId?: string;
  success?: boolean;
  contentTypeId?: string;
  authorEntryId?: string;
  latencyMs?: number;
};

type NameLookup = Record<string, string>;

const resolveLocalizedField = <T,>(
  field: Record<string, T> | undefined,
  locale: string
): T | undefined => {
  if (!field) {
    return undefined;
  }
  if (field[locale] !== undefined) {
    return field[locale];
  }
  return Object.values(field)[0];
};

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const [metrics, setMetrics] = useState<UsageMetricsResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('current');
  const [logEntries, setLogEntries] = useState<GenerationLogRecord[]>([]);
  const [logErrorMessage, setLogErrorMessage] = useState<string | null>(null);
  const [isLogLoading, setIsLogLoading] = useState(true);
  const [contentTypeNames, setContentTypeNames] = useState<NameLookup>({});
  const [authorNames, setAuthorNames] = useState<NameLookup>({});
  const [logPageInfo, setLogPageInfo] = useState({ total: 0, fetched: 0 });

  const resolveActionId = async (): Promise<string | null> => {
    const appDefinitionId = sdk.ids.app;
    if (!appDefinitionId) {
      return null;
    }

    const actions = await sdk.cma.appAction.getMany({ appDefinitionId });
    const matchedAction = actions.items.find((action) => action.name === ACTION_NAME);
    return matchedAction?.sys.id ?? null;
  };

  const resolveLogQueryStart = (mode: string, resetUnix?: number): string | undefined => {
    if (mode === 'all') {
      return undefined;
    }

    if (mode === 'last30') {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      return date.toISOString();
    }

    if (resetUnix) {
      const nextReset = new Date(resetUnix * 1000);
      const cycleStart = new Date(nextReset);
      cycleStart.setMonth(cycleStart.getMonth() - 1);
      return cycleStart.toISOString();
    }

    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString();
  };

  const normalizeLogEntry = (
    entry: GenerationLogEntry,
    defaultLocale: string
  ): GenerationLogRecord => ({
    id: entry.sys.id,
    createdAt: entry.sys.createdAt,
    entryId: resolveLocalizedField(entry.fields.entryId, defaultLocale),
    locale: resolveLocalizedField(entry.fields.locale, defaultLocale),
    charCount: resolveLocalizedField(entry.fields.charCount, defaultLocale),
    voiceId: resolveLocalizedField(entry.fields.voiceId, defaultLocale),
    success: resolveLocalizedField(entry.fields.success, defaultLocale),
    contentTypeId: resolveLocalizedField(entry.fields.contentTypeId, defaultLocale),
    authorEntryId: resolveLocalizedField(entry.fields.authorEntryId, defaultLocale),
    latencyMs: resolveLocalizedField(entry.fields.latencyMs, defaultLocale),
  });

  const resolveEntryName = (
    entry: { fields?: Record<string, Record<string, unknown>>; sys?: { id?: string } },
    defaultLocale: string
  ): string => {
    const fields = entry.fields ?? {};
    const name = (resolveLocalizedField(
      fields.name as Record<string, string> | undefined,
      defaultLocale
    ) ??
      resolveLocalizedField(fields.fullName as Record<string, string> | undefined, defaultLocale) ??
      resolveLocalizedField(fields.title as Record<string, string> | undefined, defaultLocale)) as
      | string
      | undefined;
    return name || entry.sys?.id || 'Unknown';
  };

  const hydrateLookups = async (
    logs: GenerationLogRecord[],
    defaultLocale: string
  ): Promise<void> => {
    const contentTypeIds = Array.from(
      new Set(logs.map((log) => log.contentTypeId).filter(Boolean))
    ) as string[];
    const authorEntryIds = Array.from(
      new Set(logs.map((log) => log.authorEntryId).filter(Boolean))
    ) as string[];

    if (contentTypeIds.length) {
      try {
        const contentTypes = await sdk.cma.contentType.getMany({
          spaceId: sdk.ids.space || '',
          environmentId: sdk.ids.environment || '',
          query: {
            'sys.id[in]': contentTypeIds.join(','),
            limit: contentTypeIds.length,
          },
        });
        const map: NameLookup = {};
        for (const contentType of contentTypes.items) {
          map[contentType.sys.id] = contentType.name ?? contentType.sys.id;
        }
        setContentTypeNames(map);
      } catch (error) {
        setContentTypeNames({});
      }
    } else {
      setContentTypeNames({});
    }

    if (authorEntryIds.length) {
      try {
        const authors = await sdk.cma.entry.getMany({
          spaceId: sdk.ids.space || '',
          environmentId: sdk.ids.environment || '',
          query: {
            'sys.id[in]': authorEntryIds.join(','),
            limit: authorEntryIds.length,
          },
        });
        const map: NameLookup = {};
        for (const author of authors.items as Array<{
          fields?: Record<string, Record<string, unknown>>;
          sys?: { id?: string };
        }>) {
          const name = resolveEntryName(author, defaultLocale);
          if (author.sys?.id) {
            map[author.sys.id] = name;
          }
        }
        setAuthorNames(map);
      } catch (error) {
        setAuthorNames({});
      }
    } else {
      setAuthorNames({});
    }
  };

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const appActionId = await resolveActionId();
        if (!appActionId) {
          setErrorMessage('Usage metrics action not found.');
          return;
        }

        const appActionCall = await sdk.cma.appActionCall.createWithResult(
          {
            appDefinitionId: sdk.ids.app || '',
            appActionId,
          },
          {
            parameters: {},
          }
        );

        const result = appActionCall.sys.result as AppActionResult | undefined;
        if (!result || !result.ok) {
          setErrorMessage('Unable to load usage metrics.');
          return;
        }

        setMetrics(result.data);
      } catch (error) {
        setErrorMessage('Unable to load usage metrics.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [sdk]);

  useEffect(() => {
    const fetchLogEntries = async () => {
      setIsLogLoading(true);
      setLogErrorMessage(null);

      try {
        const defaultLocale = sdk.locales.default || 'en-US';
        const logStart = resolveLogQueryStart(
          viewMode,
          metrics?.status === 'error' ? undefined : metrics?.next_character_count_reset_unix
        );
        const baseQuery: Record<string, string | number> = {
          content_type: LOG_CONTENT_TYPE_ID,
          order: '-sys.createdAt',
          limit: 1000,
        };
        if (logStart) {
          baseQuery['sys.createdAt[gte]'] = logStart;
        }

        const allLogs: GenerationLogRecord[] = [];
        let skip = 0;
        let total = 0;
        const maxPages = 5;
        let page = 0;

        while (page < maxPages) {
          const query = { ...baseQuery, skip };
          const logResponse = await sdk.cma.entry.getMany({
            spaceId: sdk.ids.space || '',
            environmentId: sdk.ids.environment || '',
            query,
          });

          const normalized = (logResponse.items as GenerationLogEntry[]).map((entry) =>
            normalizeLogEntry(entry, defaultLocale)
          );
          allLogs.push(...normalized);
          total = logResponse.total ?? total;
          skip += logResponse.items.length;
          page += 1;

          if (skip >= total || logResponse.items.length === 0) {
            break;
          }
        }

        setLogEntries(allLogs);
        setLogPageInfo({ total, fetched: allLogs.length });
        await hydrateLookups(allLogs, defaultLocale);
      } catch (error) {
        setLogErrorMessage('Unable to load generation logs.');
        setLogEntries([]);
        setContentTypeNames({});
        setAuthorNames({});
        setLogPageInfo({ total: 0, fetched: 0 });
      } finally {
        setIsLogLoading(false);
      }
    };

    fetchLogEntries();
  }, [sdk, viewMode, metrics]);

  const usagePercent = useMemo(() => {
    if (!metrics || metrics.status === 'error') {
      return 0;
    }

    if (!metrics.character_limit) {
      return 0;
    }

    return Math.min(100, Math.round((metrics.character_count / metrics.character_limit) * 100));
  }, [metrics]);

  const usageVariant = useMemo(() => {
    if (usagePercent > 90) {
      return 'negative' as const;
    }
    if (usagePercent > 75) {
      return 'warning' as const;
    }
    return 'positive' as const;
  }, [usagePercent]);

  const resetDate = useMemo(() => {
    if (!metrics || metrics.status === 'error') {
      return 'Unavailable';
    }

    return new Date(metrics.next_character_count_reset_unix * 1000).toLocaleString();
  }, [metrics]);

  const logSummary = useMemo(() => {
    const totalAttempts = logEntries.length;
    let successCount = 0;
    let failureCount = 0;
    let totalCharacters = 0;
    let latencyTotal = 0;
    let latencyCount = 0;

    const byContentType = new Map<string, { chars: number; count: number }>();
    const byAuthor = new Map<string, { chars: number; count: number }>();

    for (const log of logEntries) {
      if (log.success === true) {
        successCount += 1;
      } else if (log.success === false) {
        failureCount += 1;
      }

      if (typeof log.charCount === 'number') {
        totalCharacters += log.charCount;
      }

      if (typeof log.latencyMs === 'number') {
        latencyTotal += log.latencyMs;
        latencyCount += 1;
      }

      if (log.contentTypeId) {
        const current = byContentType.get(log.contentTypeId) ?? { chars: 0, count: 0 };
        byContentType.set(log.contentTypeId, {
          chars: current.chars + (log.charCount ?? 0),
          count: current.count + 1,
        });
      }

      if (log.authorEntryId) {
        const current = byAuthor.get(log.authorEntryId) ?? { chars: 0, count: 0 };
        byAuthor.set(log.authorEntryId, {
          chars: current.chars + (log.charCount ?? 0),
          count: current.count + 1,
        });
      }
    }

    const sortedContentTypes = Array.from(byContentType.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.chars - a.chars)
      .slice(0, 5);

    const sortedAuthors = Array.from(byAuthor.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.chars - a.chars)
      .slice(0, 5);

    const successRate = totalAttempts ? Math.round((successCount / totalAttempts) * 100) : null;

    const latencyBuckets = [
      { id: 'lt1000', label: '< 1s', count: 0 },
      { id: '1to3', label: '1–3s', count: 0 },
      { id: '3to5', label: '3–5s', count: 0 },
      { id: '5to10', label: '5–10s', count: 0 },
      { id: 'gt10', label: '> 10s', count: 0 },
    ];

    for (const log of logEntries) {
      if (typeof log.latencyMs !== 'number') {
        continue;
      }
      if (log.latencyMs < 1000) {
        latencyBuckets[0].count += 1;
      } else if (log.latencyMs < 3000) {
        latencyBuckets[1].count += 1;
      } else if (log.latencyMs < 5000) {
        latencyBuckets[2].count += 1;
      } else if (log.latencyMs < 10000) {
        latencyBuckets[3].count += 1;
      } else {
        latencyBuckets[4].count += 1;
      }
    }

    return {
      totalAttempts,
      successCount,
      failureCount,
      totalCharacters,
      averageLatency: latencyCount ? Math.round(latencyTotal / latencyCount) : null,
      successRate,
      latencyBuckets,
      topContentTypes: sortedContentTypes,
      topAuthors: sortedAuthors,
    };
  }, [logEntries]);

  if (isLoading) {
    return (
      <Box padding="spacingXl">
        <Skeleton.Container>
          <Skeleton.BodyText numberOfLines={6} />
        </Skeleton.Container>
      </Box>
    );
  }

  return (
    <Box padding="spacingXl">
      <Flex flexDirection="column" gap="spacingL">
        <Flex alignItems="center" justifyContent="space-between">
          <Heading>Broadcast Usage Dashboard</Heading>
          <Select
            id="usageViewMode"
            name="usageViewMode"
            value={viewMode}
            onChange={(event) => setViewMode(event.target.value)}
            aria-label="Usage view">
            <Select.Option value="current">Current billing cycle</Select.Option>
            <Select.Option value="last30">Last 30 days</Select.Option>
            <Select.Option value="all">All time</Select.Option>
          </Select>
        </Flex>

        {errorMessage ? (
          <Card>
            <Text>{errorMessage}</Text>
          </Card>
        ) : metrics?.status === 'error' ? (
          <Card>
            <Flex flexDirection="column" gap="spacingS">
              <Text>Unable to load ElevenLabs usage data. Please verify your API key.</Text>
              <Text>
                If you use restricted keys, enable ElevenLabs permissions: Administration &gt; User
                &gt; Read.
              </Text>
            </Flex>
          </Card>
        ) : metrics ? (
          <>
            <Card>
              <Flex flexDirection="column" gap="spacingM">
                <Paragraph>Monthly character usage</Paragraph>
                <ProgressBar value={usagePercent} variant={usageVariant} />
                <Text>
                  {metrics.character_count.toLocaleString()} /{' '}
                  {metrics.character_limit.toLocaleString()} characters ({usagePercent}%)
                </Text>
              </Flex>
            </Card>

            <Grid columns="repeat(3, 1fr)" columnGap="spacingM" rowGap="spacingM">
              <GridItem>
                <Card>
                  <Paragraph>Tier</Paragraph>
                  <Heading>{metrics.tier}</Heading>
                </Card>
              </GridItem>
              <GridItem>
                <Card>
                  <Paragraph>Status</Paragraph>
                  <Heading>{metrics.status}</Heading>
                </Card>
              </GridItem>
              <GridItem>
                <Card>
                  <Paragraph>Next reset</Paragraph>
                  <Heading>{resetDate}</Heading>
                </Card>
              </GridItem>
            </Grid>

            <Card>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Metric</TableCell>
                    <TableCell>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Characters used</TableCell>
                    <TableCell>{metrics.character_count.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Character limit</TableCell>
                    <TableCell>{metrics.character_limit.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Usage percentage</TableCell>
                    <TableCell>{usagePercent}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>

            <Card>
              <Flex flexDirection="column" gap="spacingM">
                <Heading as="h2">Generation activity</Heading>
                {isLogLoading ? (
                  <Skeleton.Container>
                    <Skeleton.BodyText numberOfLines={4} />
                  </Skeleton.Container>
                ) : logErrorMessage ? (
                  <Text>{logErrorMessage}</Text>
                ) : logEntries.length ? (
                  <Grid columns="repeat(4, 1fr)" columnGap="spacingM" rowGap="spacingM">
                    <GridItem>
                      <Card>
                        <Paragraph>Total attempts</Paragraph>
                        <Heading>{logSummary.totalAttempts.toLocaleString()}</Heading>
                      </Card>
                    </GridItem>
                    <GridItem>
                      <Card>
                        <Paragraph>Success</Paragraph>
                        <Heading>{logSummary.successCount.toLocaleString()}</Heading>
                      </Card>
                    </GridItem>
                    <GridItem>
                      <Card>
                        <Paragraph>Failed</Paragraph>
                        <Heading>{logSummary.failureCount.toLocaleString()}</Heading>
                      </Card>
                    </GridItem>
                    <GridItem>
                      <Card>
                        <Paragraph>Avg latency</Paragraph>
                        <Heading>
                          {logSummary.averageLatency ? `${logSummary.averageLatency} ms` : 'N/A'}
                        </Heading>
                      </Card>
                    </GridItem>
                  </Grid>
                ) : (
                  <Text>No generation logs yet.</Text>
                )}
                {!isLogLoading && !logErrorMessage && logEntries.length ? (
                  <Card>
                    <Flex flexDirection="column" gap="spacingS">
                      <Paragraph>Success rate</Paragraph>
                      <ProgressBar
                        value={logSummary.successRate ?? 0}
                        variant={
                          (logSummary.successRate ?? 0) > 90
                            ? 'positive'
                            : (logSummary.successRate ?? 0) > 70
                            ? 'warning'
                            : 'negative'
                        }
                      />
                      <Text>
                        {logSummary.successRate ?? 0}% success (
                        {logSummary.successCount.toLocaleString()} /{' '}
                        {logSummary.totalAttempts.toLocaleString()})
                      </Text>
                    </Flex>
                  </Card>
                ) : null}
                {!isLogLoading && !logErrorMessage && logEntries.length ? (
                  <Card>
                    <Flex flexDirection="column" gap="spacingS">
                      <Heading as="h3">Latency distribution</Heading>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Bucket</TableCell>
                            <TableCell>Attempts</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {logSummary.latencyBuckets.map((bucket) => (
                            <TableRow key={bucket.id}>
                              <TableCell>{bucket.label}</TableCell>
                              <TableCell>{bucket.count.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Flex>
                  </Card>
                ) : null}
                {!isLogLoading && !logErrorMessage && logPageInfo.total > logPageInfo.fetched ? (
                  <Text>
                    Showing {logPageInfo.fetched.toLocaleString()} of{' '}
                    {logPageInfo.total.toLocaleString()} log entries. Narrow the time range to see
                    more detail.
                  </Text>
                ) : null}
              </Flex>
            </Card>

            {!isLogLoading && !logErrorMessage && logEntries.length ? (
              <Grid columns="repeat(2, 1fr)" columnGap="spacingM" rowGap="spacingM">
                <GridItem>
                  <Card>
                    <Flex flexDirection="column" gap="spacingS">
                      <Heading as="h3">Characters by content type</Heading>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Content type</TableCell>
                            <TableCell>Characters</TableCell>
                            <TableCell>Attempts</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {logSummary.topContentTypes.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{contentTypeNames[item.id] ?? item.id}</TableCell>
                              <TableCell>{item.chars.toLocaleString()}</TableCell>
                              <TableCell>{item.count.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Flex>
                  </Card>
                </GridItem>
                <GridItem>
                  <Card>
                    <Flex flexDirection="column" gap="spacingS">
                      <Heading as="h3">Top generators</Heading>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Author</TableCell>
                            <TableCell>Characters</TableCell>
                            <TableCell>Attempts</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {logSummary.topAuthors.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{authorNames[item.id] ?? item.id}</TableCell>
                              <TableCell>{item.chars.toLocaleString()}</TableCell>
                              <TableCell>{item.count.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Flex>
                  </Card>
                </GridItem>
              </Grid>
            ) : null}
          </>
        ) : (
          <Card>
            <Text>No usage data available.</Text>
          </Card>
        )}
      </Flex>
    </Box>
  );
};

export default Page;
