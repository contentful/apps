import { Button, Flex, Heading } from '@contentful/f36-components';
import { ArrowClockwiseIcon } from '@contentful/f36-icons';
import { styles } from './Page.styles';
import { MetricCard } from '../components/MetricCard';
import { MetricsCalculator } from '../metrics/MetricsCalculator';
import { EntryProps } from 'contentful-management';

const Page = () => {
  // TODO (fetching ticket): replace this with the real fetched entries.
  const entries: EntryProps[] = [];
  const metrics = new MetricsCalculator(entries).metrics;

  return (
    <Flex flexDirection="column" style={styles.container}>
      {/* Header */}
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

      {/* Metrics Cards */}
      <Flex flexDirection="row" gap="spacing2Xs">
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

export default Page;
