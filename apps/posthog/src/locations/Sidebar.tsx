import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import {
  Box,
  Flex,
  Heading,
  Paragraph,
  Text,
  Skeleton,
  Note,
  Table,
  Button,
  Stack,
  TextLink,
  Tooltip,
  Select,
  IconButton,
} from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { Eye, Users, Clock, RefreshCw } from 'lucide-react';
import { css } from 'emotion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts';
import { PostHogClient, createPostHogClient, PostHogApiError } from '../lib/posthog';
import type {
  AppInstallationParameters,
  UrlMapping,
  EntryStats,
  DailyStats,
  SessionRecording,
  DateRangeType,
} from '../types';
import { DATE_RANGE_OPTIONS } from '../types';

// ============================================================================
// Types
// ============================================================================

interface SidebarState {
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  stats: EntryStats | null;
  dailyStats: DailyStats[];
  recordings: SessionRecording[];
  lastUpdated: Date | null;
}

// ============================================================================
// Constants & Styles
// ============================================================================

const CONTENTFUL_COLORS = {
  primary: '#0073e6',
  primaryLight: '#e6f2ff',
  gray: '#2F3E4F',
  grayLight: '#8091a5',
  gridLine: '#e5e5e5',
};

const POLLING_INTERVAL_MS = 60 * 1000; // 1 minute

const styles = {
  container: css({
    padding: '0',
  }),
  header: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  }),
  dateSelector: css({
    width: '140px',
  }),
  refreshButton: css({
    marginLeft: '8px',
  }),
  statsRow: css({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
  }),
  statCard: css({
    padding: '12px',
    textAlign: 'center',
    borderRadius: '6px',
    backgroundColor: '#f7f9fa',
    border: '1px solid #e5e5e5',
  }),
  statValue: css({
    fontSize: '24px',
    fontWeight: 600,
    color: CONTENTFUL_COLORS.gray,
    lineHeight: 1.2,
  }),
  statLabel: css({
    fontSize: '12px',
    color: CONTENTFUL_COLORS.grayLight,
    marginTop: '4px',
  }),
  chartContainer: css({
    marginBottom: '20px',
    backgroundColor: '#f7f9fa',
    borderRadius: '6px',
    padding: '12px',
    border: '1px solid #e5e5e5',
  }),
  chartHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  }),
  chartTitle: css({
    fontSize: '12px',
    color: CONTENTFUL_COLORS.grayLight,
    fontWeight: 500,
  }),
  sectionHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  }),
  sectionTitle: css({
    fontSize: '14px',
    fontWeight: 600,
    color: CONTENTFUL_COLORS.gray,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  }),
  tableCell: css({
    padding: '8px 4px !important',
    fontSize: '13px',
  }),
  watchButton: css({
    fontSize: '12px',
  }),
  noDataText: css({
    color: CONTENTFUL_COLORS.grayLight,
    fontSize: '13px',
    textAlign: 'center',
    padding: '16px 0',
  }),
  durationText: css({
    fontFamily: 'monospace',
    fontSize: '12px',
  }),
  lastUpdated: css({
    fontSize: '11px',
    color: CONTENTFUL_COLORS.grayLight,
    textAlign: 'right',
    marginTop: '4px',
  }),
  deepLink: css({
    fontSize: '12px',
  }),
  linksSection: css({
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e5e5',
  }),
  spinning: css({
    animation: 'spin 1s linear infinite',
    '@keyframes spin': {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
  }),
};

// ============================================================================
// Utility Functions
// ============================================================================

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatLastUpdated = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} mins ago`;

  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

// ============================================================================
// Custom Chart Tooltip
// ============================================================================

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; payload: DailyStats }>;
  label?: string;
}

const CustomTooltip = ({ active, payload }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;

  return (
    <Box
      padding="spacingXs"
      style={{
        fontSize: '12px',
        backgroundColor: 'white',
        border: '1px solid #e5e5e5',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
      <Text fontWeight="fontWeightMedium">{formatDate(data.date)}</Text>
      <Box marginTop="spacing2Xs">
        <Text fontColor="gray600">{data.pageviews} views</Text>
        <br />
        <Text fontColor="gray600">{data.uniqueUsers} users</Text>
      </Box>
    </Box>
  );
};

// ============================================================================
// Sub-Components
// ============================================================================

const StatsDisplay = ({ stats }: { stats: EntryStats }) => (
  <div className={styles.statsRow}>
    <div className={styles.statCard}>
      <div className={styles.statValue}>{formatNumber(stats.pageviews)}</div>
      <div className={styles.statLabel}>
        <Flex alignItems="center" justifyContent="center" gap="spacing2Xs">
          <Eye size={14} />
          Page Views
        </Flex>
      </div>
    </div>
    <div className={styles.statCard}>
      <div className={styles.statValue}>{formatNumber(stats.uniqueUsers)}</div>
      <div className={styles.statLabel}>
        <Flex alignItems="center" justifyContent="center" gap="spacing2Xs">
          <Users size={14} />
          Unique Users
        </Flex>
      </div>
    </div>
  </div>
);

interface TrafficChartProps {
  data: DailyStats[];
  dateRange: DateRangeType;
  deepLink: string;
}

const TrafficChart = ({ data, dateRange, deepLink }: TrafficChartProps) => {
  const chartData = data.map((d) => ({
    ...d,
    displayDate: formatDate(d.date),
  }));

  // Calculate chart height based on date range
  const chartHeight = dateRange === 'last30d' ? 140 : 120;

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitle}>{DATE_RANGE_OPTIONS[dateRange].label}</div>
        <TextLink
          href={deepLink}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.deepLink}>
          View in PostHog
          <ExternalLinkIcon size="tiny" style={{ marginLeft: '4px' }} />
        </TextLink>
      </div>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CONTENTFUL_COLORS.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={CONTENTFUL_COLORS.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CONTENTFUL_COLORS.gridLine}
            vertical={false}
          />
          <XAxis
            dataKey="displayDate"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: CONTENTFUL_COLORS.grayLight }}
            interval={dateRange === 'last30d' ? 6 : dateRange === 'last14d' ? 2 : 0}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: CONTENTFUL_COLORS.grayLight }}
            width={30}
          />
          <RechartsTooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="pageviews"
            stroke={CONTENTFUL_COLORS.primary}
            strokeWidth={2}
            fill="url(#colorViews)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface SessionRecordingsTableProps {
  recordings: SessionRecording[];
  deepLink: string;
}

const SessionRecordingsTable = ({ recordings, deepLink }: SessionRecordingsTableProps) => {
  if (recordings.length === 0) {
    return <Paragraph className={styles.noDataText}>No recent session recordings found</Paragraph>;
  }

  return (
    <>
      <Table>
        <Table.Head>
          <Table.Row>
            <Table.Cell className={styles.tableCell}>User</Table.Cell>
            <Table.Cell className={styles.tableCell}>Duration</Table.Cell>
            <Table.Cell className={styles.tableCell} style={{ width: '70px' }} />
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {recordings.map((recording) => (
            <Table.Row key={recording.id}>
              <Table.Cell className={styles.tableCell}>
                <Tooltip content={`Started: ${formatDateTime(recording.startTime)}`}>
                  <Text fontSize="fontSizeS">{recording.distinctId}</Text>
                </Tooltip>
              </Table.Cell>
              <Table.Cell className={styles.tableCell}>
                <Text className={styles.durationText}>{formatDuration(recording.duration)}</Text>
              </Table.Cell>
              <Table.Cell className={styles.tableCell}>
                <Button
                  as="a"
                  href={recording.recordingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="secondary"
                  size="small"
                  className={styles.watchButton}
                  endIcon={<ExternalLinkIcon size="tiny" />}>
                  Watch
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <Box marginTop="spacingXs">
        <TextLink
          href={deepLink}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.deepLink}>
          View all recordings
          <ExternalLinkIcon size="tiny" style={{ marginLeft: '4px' }} />
        </TextLink>
      </Box>
    </>
  );
};

// ============================================================================
// Loading Skeleton
// ============================================================================

const LoadingSkeleton = () => (
  <Skeleton.Container>
    <Skeleton.Image height={40} width="100%" />
    <Skeleton.Image height={70} width="100%" offsetTop={56} />
    <Skeleton.Image height={140} width="100%" offsetTop={142} />
    <Skeleton.BodyText numberOfLines={3} offsetTop={300} />
  </Skeleton.Container>
);

// ============================================================================
// Main Sidebar Component
// ============================================================================

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();

  const [state, setState] = useState<SidebarState>({
    isLoading: true,
    isRefreshing: false,
    error: null,
    stats: null,
    dailyStats: [],
    recordings: [],
    lastUpdated: null,
  });

  const [dateRange, setDateRange] = useState<DateRangeType>('last7d');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const clientRef = useRef<PostHogClient | null>(null);

  // Get installation parameters
  const params = sdk.parameters.installation as AppInstallationParameters;

  // Find URL mapping for current content type
  const currentContentType = sdk.contentType.sys.id;
  const urlMapping = useMemo(() => {
    return (params.urlMappings || []).find(
      (m: UrlMapping) => m.contentTypeId === currentContentType
    );
  }, [params.urlMappings, currentContentType]);

  // Get slug field value
  const getSlugValue = useCallback((): string | null => {
    const slugFieldNames = ['slug', 'urlSlug', 'path', 'permalink', 'handle'];

    for (const fieldName of slugFieldNames) {
      if (sdk.entry.fields[fieldName]) {
        const value = sdk.entry.fields[fieldName].getValue();
        if (typeof value === 'string' && value.trim()) {
          return value;
        }
      }
    }

    const displayField = sdk.contentType.displayField;
    if (displayField && sdk.entry.fields[displayField]) {
      const value = sdk.entry.fields[displayField].getValue();
      if (typeof value === 'string') {
        return value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }
    }

    return null;
  }, [sdk.entry.fields, sdk.contentType.displayField]);

  // Initialize client
  useEffect(() => {
    if (params.personalApiKey && params.projectId && params.posthogHost) {
      clientRef.current = createPostHogClient(params);
    }
  }, [params]);

  // Fetch analytics data
  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!params.personalApiKey || !params.projectId || !params.posthogHost) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: 'PostHog app is not configured. Please complete the app configuration.',
        }));
        return;
      }

      if (!urlMapping) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: `No URL mapping configured for content type "${currentContentType}". Add a mapping in the app configuration.`,
        }));
        return;
      }

      const slug = getSlugValue();
      if (!slug) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: 'Could not determine entry slug. Ensure the entry has a slug field with a value.',
        }));
        return;
      }

      if (isRefresh) {
        setState((prev) => ({ ...prev, isRefreshing: true }));
      }

      try {
        const client = clientRef.current || createPostHogClient(params);

        // Clear cache on refresh
        if (isRefresh) {
          client.clearCache();
        }

        const [stats, dailyStats, recordings] = await Promise.all([
          client.getEntryStats(slug, urlMapping.urlPattern, dateRange),
          client.getDailyStats(slug, urlMapping.urlPattern, dateRange),
          client.getRecentRecordings(slug, urlMapping.urlPattern, 5),
        ]);

        setState({
          isLoading: false,
          isRefreshing: false,
          error: null,
          stats,
          dailyStats,
          recordings,
          lastUpdated: new Date(),
        });
      } catch (error) {
        let errorMessage = 'Failed to fetch PostHog data';

        if (error instanceof PostHogApiError) {
          if (error.isAuthError()) {
            errorMessage = 'Authentication failed. Please check your Personal API Key.';
          } else if (error.isRateLimited()) {
            errorMessage = 'Rate limited by PostHog. Please try again in a few minutes.';
          } else {
            errorMessage = error.message;
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: errorMessage,
        }));
      }
    },
    [params, urlMapping, currentContentType, getSlugValue, dateRange]
  );

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling for real-time updates
  useEffect(() => {
    // Start polling
    pollingRef.current = setInterval(() => {
      if (!state.isLoading && !state.isRefreshing && !state.error) {
        fetchData(true);
      }
    }, POLLING_INTERVAL_MS);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchData, state.isLoading, state.isRefreshing, state.error]);

  // Field change listener
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];
    const slugFieldNames = ['slug', 'urlSlug', 'path', 'permalink', 'handle'];

    for (const fieldName of slugFieldNames) {
      if (sdk.entry.fields[fieldName]) {
        const unsub = sdk.entry.fields[fieldName].onValueChanged(() => {
          setTimeout(() => fetchData(), 500);
        });
        unsubscribers.push(unsub);
      }
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [fetchData, sdk.entry.fields]);

  // Handle date range change
  const handleDateRangeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRange = e.target.value as DateRangeType;
    setDateRange(newRange);
  }, []);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Open app config
  const handleOpenConfig = async () => {
    await sdk.navigator.openAppConfig();
  };

  // Generate deep links
  const slug = getSlugValue();
  const insightsDeepLink = useMemo(() => {
    if (!clientRef.current || !slug || !urlMapping) return '#';
    return clientRef.current.getInsightsDeepLink(slug, urlMapping.urlPattern, dateRange);
  }, [slug, urlMapping, dateRange]);

  const recordingsDeepLink = useMemo(() => {
    if (!clientRef.current || !slug || !urlMapping) return '#';
    return clientRef.current.getRecordingsDeepLink(slug, urlMapping.urlPattern);
  }, [slug, urlMapping]);

  // Render loading state
  if (state.isLoading) {
    return (
      <Box className={styles.container}>
        <LoadingSkeleton />
      </Box>
    );
  }

  // Render error state
  if (state.error) {
    return (
      <Box className={styles.container}>
        <Note variant="warning" title="PostHog Analytics">
          <Paragraph marginBottom="spacingS">{state.error}</Paragraph>
          <TextLink as="button" onClick={handleOpenConfig}>
            Open app configuration
          </TextLink>
        </Note>
      </Box>
    );
  }

  // Render empty state
  if (!state.stats || (state.stats.pageviews === 0 && state.stats.uniqueUsers === 0)) {
    return (
      <Box className={styles.container}>
        <Note variant="neutral" title="No Analytics Data">
          <Paragraph>
            No page views have been recorded for this entry yet. This could mean:
          </Paragraph>
          <ul style={{ margin: '8px 0 0 16px', paddingLeft: '8px' }}>
            <li>The page hasn't been published or visited</li>
            <li>PostHog tracking isn't configured for this URL</li>
            <li>The URL pattern mapping may be incorrect</li>
          </ul>
        </Note>
      </Box>
    );
  }

  // Render main content
  return (
    <Box className={styles.container}>
      {/* Header with date selector and refresh */}
      <div className={styles.header}>
        <Select
          id="dateRange"
          name="dateRange"
          value={dateRange}
          onChange={handleDateRangeChange}
          className={styles.dateSelector}
          size="small">
          {Object.entries(DATE_RANGE_OPTIONS).map(([key, config]) => (
            <Select.Option key={key} value={key}>
              {config.label}
            </Select.Option>
          ))}
        </Select>
        <Tooltip content="Refresh data">
          <IconButton
            variant="transparent"
            aria-label="Refresh data"
            icon={<RefreshCw size={16} className={state.isRefreshing ? styles.spinning : ''} />}
            size="small"
            onClick={handleRefresh}
            isDisabled={state.isRefreshing}
            className={styles.refreshButton}
          />
        </Tooltip>
      </div>

      {/* Stats Overview */}
      <StatsDisplay stats={state.stats} />

      {/* Traffic Chart */}
      <TrafficChart data={state.dailyStats} dateRange={dateRange} deepLink={insightsDeepLink} />

      {/* Session Recordings */}
      <Box marginBottom="spacingM">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <Clock size={14} />
            Session Replays
          </div>
        </div>
        <SessionRecordingsTable recordings={state.recordings} deepLink={recordingsDeepLink} />
      </Box>

      {/* Last Updated & Dashboard Link */}
      <div className={styles.linksSection}>
        <Flex justifyContent="space-between" alignItems="center">
          <TextLink
            href={`${params.posthogHost}/project/${params.projectId}`}
            target="_blank"
            rel="noopener noreferrer"
            icon={<ExternalLinkIcon />}
            alignIcon="end">
            Open PostHog
          </TextLink>
          {state.lastUpdated && (
            <div className={styles.lastUpdated}>Updated {formatLastUpdated(state.lastUpdated)}</div>
          )}
        </Flex>
      </div>
    </Box>
  );
};

export default Sidebar;
