import { Flex, Heading, Button, Box } from '@contentful/f36-components';
import { ArrowClockwiseIcon } from '@contentful/f36-icons';
import { MetricCard } from './MetricCard';
import { MetricsCalculator } from '../metrics/MetricsCalculator';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { AppInstallationParameters } from '../locations/ConfigScreen';
import { ErrorDisplay } from './ErrorDisplay';
import { useAllEntries } from '../hooks/useAllEntries';
import { useScheduledActions } from '../hooks/useScheduledActions';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ReleasesTable } from './ReleasesTable';
import { styles } from './Dashboard.styles';

const Dashboard = () => {
  const sdk = useSDK();
  const installation = (sdk.parameters.installation ?? {}) as AppInstallationParameters;
  const { entries, isFetchingEntries, fetchingEntriesError, refetchEntries } = useAllEntries();
  const {
    scheduledActions,
    isFetchingScheduledActions,
    fetchingScheduledActionsError,
    refetchScheduledActions,
  } = useScheduledActions();

  const handleRefresh = () => {
    refetchEntries();
    refetchScheduledActions();
  };

  const isRefreshing = isFetchingEntries || isFetchingScheduledActions;
  const hasError = fetchingEntriesError || fetchingScheduledActionsError;

  const metricsCalculator = new MetricsCalculator(entries, scheduledActions, {
    needsUpdateMonths: installation.needsUpdateMonths,
    recentlyPublishedDays: installation.recentlyPublishedDays,
    timeToPublishDays: installation.timeToPublishDays,
  });
  const metrics = metricsCalculator.getAllMetrics();

  return (
    <Flex flexDirection="column" style={styles.container}>
      <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingXs">
        <Heading>Content Dashboard</Heading>
        <Button
          variant="secondary"
          size="small"
          startIcon={<ArrowClockwiseIcon />}
          onClick={handleRefresh}
          isDisabled={isRefreshing}>
          Refresh
        </Button>
      </Flex>

      {hasError ? (
        <ErrorDisplay error={fetchingEntriesError} />
      ) : isRefreshing ? (
        <LoadingSkeleton metricsCount={metricsCalculator.getAllMetrics().length} />
      ) : (
        <>
        <Flex flexDirection="row" gap="spacingM" style={styles.metricsContainer}>
          {metrics.map((metric) => {
            return (
              <MetricCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                subtitle={metric.subtitle}
                isNegative={metric.isNegative}
              />
            );
          })}
        </Flex>
          <Box marginTop="spacingXl">
            <Box padding="spacingL" style={styles.releasesTableContainer}>
              <Heading as="h2" marginBottom="spacingM">
                Upcoming Scheduled Releases
              </Heading>
              <ReleasesTable />
            </Box>
          </Box>
        </>
      )}
    </Flex>
  );
};

export default Dashboard;
