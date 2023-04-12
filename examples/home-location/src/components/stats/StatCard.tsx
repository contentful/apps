import { Card, Flex, Text } from '@contentful/f36-components';
import React from 'react';

interface StatCardProps {
  count: number;
  title: string;
}

export const StatCard = ({ count, title }: StatCardProps) => (
  <Card padding="large">
    <Flex flexDirection="column" alignItems="center" gap="spacingL">
      <Text fontSize="fontSize4Xl" fontWeight="fontWeightDemiBold">
        {count}
      </Text>
      <Text fontColor="gray700" fontSize="fontSizeXl">
        {title}
      </Text>
    </Flex>
  </Card>
);
