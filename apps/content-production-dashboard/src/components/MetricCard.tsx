import { Card, Flex, Text } from '@contentful/f36-components';
import { styles } from './MetricCard.styles';

export type MetricCardProps = {
  title: string;
  value: string;
  subtitle: string;
  isNegative?: boolean;
};

export const MetricCard = ({ title, value, subtitle, isNegative }: MetricCardProps) => {
  return (
    <Card padding="default" style={styles.card}>
      <Flex justifyContent="space-between" alignItems="center">
        <Flex flexDirection="column" gap="spacing2Xs">
          <Text fontSize="fontSizeS" fontColor="gray600" fontWeight="fontWeightDemiBold">
            {title}
          </Text>
          <Text fontSize="fontSizeXl" fontWeight="fontWeightDemiBold">
            {value}
          </Text>
          <Text fontSize="fontSizeS" fontColor={isNegative ? 'red600' : 'gray500'}>
            {subtitle}
          </Text>
        </Flex>
      </Flex>
    </Card>
  );
};
