import { useState, useCallback, useEffect, useRef } from 'react';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { Box, Tabs, Text, TextLink, Note } from '@contentful/f36-components';
import { AnalyticsDisplay } from '../components/AnalyticsDisplay';
import { RecordingsList } from '../components/RecordingsList';
import { useSidebarSlug } from '../hooks/useSidebarSlug';
import { usePostHogApi } from '../hooks/usePostHogApi';
import { styles } from './Sidebar.styles';
import type {
  AnalyticsMetrics,
  DateRange,
  SidebarTab,
  PostHogConfiguration,
  SessionRecording,
} from '../types';

/** Auto-refresh interval in milliseconds (10 seconds per spec) */
const AUTO_REFRESH_INTERVAL = 10 * 1000;

/**
 * PostHog Analytics Sidebar Component
 *
 * Displays analytics data for the current entry based on its configured URL.
 * Shows page views, unique visitors, and session duration metrics.
 * Auto-refreshes every 10 seconds for real-time updates.
 *
 * Future tabs will include:
 * - Session Recordings (US2)
 * - Feature Flags (US3)
 */
const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();

  // Get URL from the current entry
  const { pageUrl, error: slugError, isConfigured } = useSidebarSlug();

  // PostHog API hook
  const { queryAnalytics, listRecordings } = usePostHogApi();

  // Tab state - only analytics for now, recordings and flags will be added later
  const [activeTab, setActiveTab] = useState<SidebarTab>('analytics');

  // Analytics state
  const [dateRange, setDateRange] = useState<DateRange>('last7days');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Recordings state
  const [recordings, setRecordings] = useState<SessionRecording[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const [recordingsError, setRecordingsError] = useState<string | null>(null);

  // Ref to track if component is mounted (for async cleanup)
  const isMountedRef = useRef(true);

  // Get installation parameters to check if app is configured
  const installationParams = sdk.parameters.installation as PostHogConfiguration | undefined;
  const isAppConfigured = Boolean(
    installationParams?.posthogApiKey &&
      installationParams?.posthogProjectId &&
      installationParams?.posthogHost
  );

  // Fetch analytics data
  const fetchAnalytics = useCallback(
    async (showLoading = false) => {
      if (!pageUrl) return;

      if (showLoading) {
        setIsLoading(true);
      }

      try {
        const response = await queryAnalytics(pageUrl, dateRange);

        if (!isMountedRef.current) return;

        if (response.success && response.data) {
          setMetrics(response.data);
          setError(null);
          setLastUpdated(new Date());
        } else {
          setError(response.error?.message || 'Failed to fetch analytics');
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [pageUrl, dateRange, queryAnalytics]
  );

  // Initial fetch when pageUrl or dateRange changes
  useEffect(() => {
    if (isAppConfigured && isConfigured && pageUrl) {
      fetchAnalytics(true);
    }
  }, [isAppConfigured, isConfigured, pageUrl, dateRange, fetchAnalytics]);

  // Auto-refresh interval
  useEffect(() => {
    // Only run auto-refresh if app is properly configured and we have a URL
    if (!isAppConfigured || !isConfigured || !pageUrl) {
      return;
    }

    // Set up the interval
    const intervalId = setInterval(() => {
      // Only refresh if not currently loading and on analytics tab
      if (!isLoading && activeTab === 'analytics') {
        fetchAnalytics(false); // Silent refresh (no loading indicator)
      }
    }, AUTO_REFRESH_INTERVAL);

    // Cleanup on unmount or when dependencies change
    return () => {
      clearInterval(intervalId);
    };
  }, [isAppConfigured, isConfigured, pageUrl, isLoading, activeTab, fetchAnalytics]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch recordings
  const fetchRecordings = useCallback(async () => {
    if (!pageUrl) return;

    setRecordingsLoading(true);
    try {
      const response = await listRecordings(pageUrl);

      if (!isMountedRef.current) return;

      if (response.success && response.data) {
        setRecordings(response.data.recordings);
        setRecordingsError(null);
      } else {
        setRecordingsError(response.error?.message || 'Failed to fetch recordings');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setRecordingsError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      if (isMountedRef.current) {
        setRecordingsLoading(false);
      }
    }
  }, [pageUrl, listRecordings]);

  // Fetch recordings when switching to recordings tab
  useEffect(() => {
    if (activeTab === 'recordings' && isAppConfigured && isConfigured && pageUrl) {
      fetchRecordings();
    }
  }, [activeTab, isAppConfigured, isConfigured, pageUrl, fetchRecordings]);

  // Handle date range change
  const handleDateRangeChange = useCallback((newRange: DateRange) => {
    setDateRange(newRange);
  }, []);

  // Handle opening app config
  const handleOpenConfig = useCallback(async () => {
    await sdk.navigator.openAppConfig();
  }, [sdk.navigator]);

  // Format last updated time
  const formatLastUpdated = (date: Date): string => {
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 10) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Show not configured state if app credentials are missing
  if (!isAppConfigured) {
    return (
      <Box className={styles.container}>
        <div className={styles.notConfiguredContainer}>
          <Note variant="warning" title="App Not Configured">
            <Text marginBottom="spacingS">
              Please configure the PostHog app with your API credentials to view analytics.
            </Text>
            <TextLink as="button" onClick={handleOpenConfig}>
              Open app configuration
            </TextLink>
          </Note>
        </div>
      </Box>
    );
  }

  // Show error if content type is not configured for analytics
  if (!isConfigured || slugError) {
    return (
      <Box className={styles.container}>
        <div className={styles.notConfiguredContainer}>
          <Note variant="neutral" title="Configuration Required">
            <Text marginBottom="spacingS">
              {slugError || 'This content type is not configured for analytics.'}
            </Text>
            <TextLink as="button" onClick={handleOpenConfig}>
              Configure content type mapping
            </TextLink>
          </Note>
        </div>
      </Box>
    );
  }

  return (
    <Box className={styles.container}>
      {/* Tab Navigation */}
      <Tabs currentTab={activeTab} onTabChange={(tab) => setActiveTab(tab as SidebarTab)}>
        <Tabs.List className={styles.tabList}>
          <Tabs.Tab panelId="analytics">Analytics</Tabs.Tab>
          <Tabs.Tab panelId="recordings">Recordings</Tabs.Tab>
          {/* Feature Flags tab will be added in US3 */}
        </Tabs.List>

        {/* Analytics Tab Panel */}
        <Tabs.Panel id="analytics">
          <AnalyticsDisplay
            metrics={metrics}
            isLoading={isLoading}
            error={error}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
          />

          {/* Last updated indicator */}
          {pageUrl && !isLoading && !error && lastUpdated && (
            <div className={styles.refreshIndicator}>
              <Text fontColor="gray500" fontSize="fontSizeS">
                Updated {formatLastUpdated(lastUpdated)} · Auto-refreshing
              </Text>
            </div>
          )}
        </Tabs.Panel>

        {/* Recordings Tab Panel */}
        <Tabs.Panel id="recordings">
          <RecordingsList
            recordings={recordings}
            isLoading={recordingsLoading}
            error={recordingsError}
            posthogHost={installationParams?.posthogHost}
            projectId={installationParams?.posthogProjectId}
          />
        </Tabs.Panel>

        {/* Feature Flags tab panel will be added in US3 */}
      </Tabs>
    </Box>
  );
};

export default Sidebar;
