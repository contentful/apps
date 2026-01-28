import { Flex, Paragraph, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { CSSProperties } from 'react';

const emptyStateContainer: CSSProperties = {
  flexDirection: 'column',
  padding: tokens.spacingL,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: tokens.gray100,
  borderRadius: tokens.borderRadiusMedium,
  border: `1px solid ${tokens.gray200}`,
  height: '300px',
  marginRight: tokens.spacingS,
  marginLeft: tokens.spacingS,
  marginBottom: tokens.spacingL,
};

export const EmptyState: React.FC<{ helperText: string }> = ({ helperText }) => {
  return (
    <Flex style={emptyStateContainer}>
      <Text fontSize="fontSizeM" fontWeight="fontWeightDemiBold">
        No data to display
      </Text>
      <Paragraph>{helperText}</Paragraph>
    </Flex>
  );
};
