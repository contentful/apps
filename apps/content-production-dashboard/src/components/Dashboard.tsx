import { Button, Flex, Heading } from '@contentful/f36-components';
import { ArrowClockwiseIcon } from '@contentful/f36-icons';
import { MetricCard } from './MetricCard';
import { MetricsCalculator } from '../metrics/MetricsCalculator';
import { EntryProps, ScheduledActionProps } from 'contentful-management';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { AppInstallationParameters } from '../locations/ConfigScreen';
import { styles } from '../locations/Page.styles';

const Dashboard = () => {
  const sdk = useSDK();
  const installation = (sdk.parameters.installation ?? {}) as AppInstallationParameters;

  // TODO : replace this with the real fetched entries.
  const entries: EntryProps[] = [];
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
        <Button
          variant="secondary"
          startIcon={<ArrowClockwiseIcon />}
          onClick={() => {
            // Refresh functionality to be implemented later
          }}>
          Refresh
        </Button>
      </Flex>

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
    </Flex>
  );
};

export default Dashboard;
