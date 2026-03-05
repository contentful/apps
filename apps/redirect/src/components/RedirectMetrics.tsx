import { Card, Flex, Text } from '@contentful/f36-components';
import { redirectMetricsStyles as styles } from './RedirectMetrics.styles';

interface MetricItem {
  label: string;
  value: number | string;
}

interface RedirectMetricsProps {
  metrics: MetricItem[];
  isLoading?: boolean;
}

export const RedirectMetrics = ({ metrics, isLoading = false }: RedirectMetricsProps) => {
  return (
    <Flex gap="spacingM" marginBottom="spacingL">
      {metrics.map((metric) => (
        <Card key={metric.label} padding="default" style={styles.card}>
          <Flex flexDirection="column" justifyContent="space-between" fullHeight>
            <Text fontSize="fontSizeL" fontWeight="fontWeightDemiBold" style={styles.text}>
              {metric.label}
            </Text>
            <Text fontSize="fontSize2Xl" fontWeight="fontWeightDemiBold" marginBottom="spacingXs">
              {isLoading ? '—' : String(metric.value)}
            </Text>
          </Flex>
        </Card>
      ))}
    </Flex>
  );
};
