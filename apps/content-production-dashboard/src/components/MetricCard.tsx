import { Card, Flex, Text } from '@contentful/f36-components';
import type { IconProps } from '@contentful/f36-icons';
import type { ComponentType } from 'react';
import tokens from '@contentful/f36-tokens';
import { styles } from './MetricCard.styles';

export type MetricCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: ComponentType<IconProps>;
  isNegative?: boolean;
};

export const MetricCard = ({ title, value, subtitle, icon: Icon, isNegative }: MetricCardProps) => {
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
        <Icon color={tokens.gray900} />
      </Flex>
    </Card>
  );
};
