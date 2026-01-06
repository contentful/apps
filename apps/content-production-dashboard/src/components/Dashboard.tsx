import { Flex, Box, Heading } from '@contentful/f36-components';
import { MetricCard } from './MetricCard';
import { MetricsCalculator } from '../metrics/MetricsCalculator';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { AppInstallationParameters } from '../locations/ConfigScreen';
import { styles } from '../locations/Page.styles';
import { ErrorDisplay } from './ErrorDisplay';
import { LoadingSkeleton } from './LoadingSkeleton';
import { useAllEntries } from '../hooks/useAllEntries';
import { useScheduledActions } from '../hooks/useScheduledActions';

const Dashboard = () => {
  const sdk = useSDK();
  const installation = (sdk.parameters.installation ?? {}) as AppInstallationParameters;
  const { entries, isFetchingEntries, fetchingEntriesError } = useAllEntries();
  const { scheduledActions, isFetchingScheduledActions, fetchingScheduledActionsError } =
    useScheduledActions();

  const metricsCalculator = new MetricsCalculator(entries, scheduledActions, {
    needsUpdateMonths: installation.needsUpdateMonths,
    recentlyPublishedDays: installation.recentlyPublishedDays,
    timeToPublishDays: installation.timeToPublishDays,
  });
  const metrics = metricsCalculator.getAllMetrics();

  return (
    <Flex flexDirection="column" style={styles.container}>
      <Box marginBottom="spacingXs">
        <Heading>Content Dashboard</Heading>
      </Box>

      {fetchingEntriesError || fetchingScheduledActionsError ? (
        <ErrorDisplay error={fetchingEntriesError} />
      ) : isFetchingEntries || isFetchingScheduledActions ? (
        <LoadingSkeleton />
      ) : (
        <>
          <Flex flexDirection="row" gap="spacingM">
            {metrics.map((metric) => {
              return (
                <MetricCard
                  key={metric.title}
                  title={metric.title}
                  value={metric.value}
                  subtitle={metric.subtitle}
                  icon={metric.icon}
                  isNegative={metric.isNegative}
                />
              );
            })}
          </Flex>
        </>
      )}
    </Flex>
  );
};

export default Dashboard;
