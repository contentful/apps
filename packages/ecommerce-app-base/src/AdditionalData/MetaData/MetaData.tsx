import * as React from 'react';
import { FC, ReactNode } from 'react';
import { Box, Caption, Text } from '@contentful/f36-components';
import { Row } from './Row';
import { Column } from './Column';

type RowData = {
  name: string;
  value: ReactNode;
};

type ColumnData = {
  title: string;
  rows: Array<RowData>;
};

type MetaData = {
  columns: Array<ColumnData>;
};

export const MetaData: FC<MetaData> = ({ columns }) => {
  const renderRow = (row: RowData) => {
    return (
      <Box key={row.name}>
        <Caption as={'span'} marginRight={'spacingM'} color={'gray700'}>
          {row.name}:
        </Caption>
        <Caption as={'span'} color={'gray900'}>
          {row.value}
        </Caption>
      </Box>
    );
  };

  const renderColumn = (column: ColumnData) => {
    return (
      <Column key={column.title}>
        <Caption as={'h3'} fontWeight={'fontWeightMedium'} marginBottom={'spacingM'}>
          {column.title}
        </Caption>
        {column.rows.map((row) => renderRow(row))}
      </Column>
    );
  };

  return <Row>{columns.map((column) => renderColumn(column))}</Row>;
};
