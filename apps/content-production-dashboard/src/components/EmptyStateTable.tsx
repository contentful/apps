import { Flex, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { CSSProperties } from 'react';

const emptyStateStyle: CSSProperties = {
  border: `1px solid ${tokens.gray300}`,
  borderRadius: tokens.borderRadiusMedium,
  backgroundColor: tokens.colorWhite,
  minHeight: '280px',
};

export const EmptyStateTable = () => {
  return (
    <Flex padding="spacing3Xl" style={emptyStateStyle} flexDirection="column" alignItems="center" justifyContent="center">
      <Text fontSize="fontSizeL" fontColor="gray600" fontWeight="fontWeightDemiBold">
        No entries found
      </Text>
    </Flex>
  );
};