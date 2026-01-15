import { Table, Box, Text } from '@contentful/f36-components';
import { CSSProperties } from 'react';

const emptyStateStyle: CSSProperties = {
  minHeight: '280px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

interface EmptyStateTableProps {
  colSpan: number;
}

export const EmptyStateTable = ({ colSpan }: EmptyStateTableProps) => {
  return (
    <Table.Row>
      <Table.Cell colSpan={colSpan}>
        <Box padding="spacing3Xl" style={emptyStateStyle}>
          <Text fontSize="fontSizeL" fontWeight="fontWeightDemiBold">
            No content found
          </Text>
        </Box>
      </Table.Cell>
    </Table.Row>
  );
};

