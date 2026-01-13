import { useState, useCallback } from 'react';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { Box, Tabs, Text, TextLink, Note } from '@contentful/f36-components';
import { AnalyticsDisplay } from '../components/AnalyticsDisplay';
import { useSidebarSlug } from '../hooks/useSidebarSlug';
import { styles } from './Sidebar.styles';
import type { AnalyticsMetrics, DateRange, SidebarTab, PostHogConfiguration } from '../types';

/**
 * PostHog Analytics Sidebar Component
 *
 * Displays analytics data for the current entry based on its configured URL.
 * Shows page views, unique visitors, and session duration metrics.
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

  // Tab state - only analytics for now, recordings and flags will be added later
  const [activeTab, setActiveTab] = useState<SidebarTab>('analytics');

  // Analytics state
  const [dateRange, setDateRange] = useState<DateRange>('last7days');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);

  // Get installation parameters to check if app is configured
  const installationParams = sdk.parameters.installation as PostHogConfiguration | undefined;
  const isAppConfigured = Boolean(
    installationParams?.posthogApiKey &&
      installationParams?.posthogProjectId &&
      installationParams?.posthogHost
  );

  // Handle date range change
  const handleDateRangeChange = useCallback((newRange: DateRange) => {
    setDateRange(newRange);
    // TODO: Trigger analytics refetch when usePostHogApi is implemented (T030)
  }, []);

  // Handle opening app config
  const handleOpenConfig = useCallback(async () => {
    await sdk.navigator.openAppConfig();
  }, [sdk.navigator]);

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
          {/* Future tabs will be added here:
          <Tabs.Tab panelId="recordings">Recordings</Tabs.Tab>
          <Tabs.Tab panelId="flags">Feature Flags</Tabs.Tab>
          */}
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

          {/* Page URL info */}
          {pageUrl && !isLoading && !error && (
            <div className={styles.refreshIndicator}>
              <Text fontColor="gray500" fontSize="fontSizeS">
                Tracking: {pageUrl}
              </Text>
            </div>
          )}
        </Tabs.Panel>

        {/* Future tab panels will be added here:
        <Tabs.Panel id="recordings">
          <RecordingsList />
        </Tabs.Panel>
        <Tabs.Panel id="flags">
          <FeatureFlagsList />
        </Tabs.Panel>
        */}
      </Tabs>
    </Box>
  );
};

export default Sidebar;
