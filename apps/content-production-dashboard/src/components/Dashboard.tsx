import { Button, Flex, Heading } from '@contentful/f36-components';
import { MetricCard } from './MetricCard';
import { MetricsCalculator } from '../metrics/MetricsCalculator';
import { ScheduledActionProps } from 'contentful-management';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { AppInstallationParameters } from '../locations/ConfigScreen';
import { styles } from '../locations/Page.styles';
import { ErrorDisplay } from './ErrorDisplay';
import { LoadingSkeleton } from './LoadingSkeleton';
import { useAllEntries } from '../hooks/useAllEntries';

const Dashboard = () => {
  const sdk = useSDK();
  const installation = (sdk.parameters.installation ?? {}) as AppInstallationParameters;
  const { entries, isFetching, error, refetch } = useAllEntries();

  // TODO : replace this with the real scheduled actions.
  const scheduledActions: ScheduledActionProps[] = [];

  const metrics = new MetricsCalculator(entries, scheduledActions, {
    needsUpdateMonths: installation.needsUpdateMonths,
    recentlyPublishedDays: installation.recentlyPublishedDays,
    timeToPublishDays: installation.timeToPublishDays,
  }).metrics;

  return (
    <Flex flexDirection="column" style={styles.container}>
      <Flex flexDirection="row" justifyContent="space-between" marginBottom="spacingL">
        <Heading>Content Dashboard</Heading>
        <Button onClick={() => refetch()} variant="secondary" size="small" isDisabled={isFetching}>
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Flex>

      {error ? (
        <ErrorDisplay error={error} />
      ) : isFetching ? (
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
