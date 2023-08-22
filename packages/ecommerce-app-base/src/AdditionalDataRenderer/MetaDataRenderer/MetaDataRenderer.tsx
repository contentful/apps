import * as React from 'react';
import { FC, ReactNode } from 'react';
import { Box, Caption } from '@contentful/f36-components';
import { Row } from './Row';
import { Column } from './Column';
import { Container } from '../Container';

type RowData = {
  name: string;
  value: string | ReactNode;
};

export type ColumnData = {
  title: string;
  rows: Array<RowData>;
};

export type MetaDataProps = {
  columns: Array<ColumnData>;
};

export const MetaDataRenderer: FC<MetaDataProps> = ({ columns }) => {
  const renderMetaRow = (row: RowData) => {
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
        {column.rows.map((row) => renderMetaRow(row))}
      </Column>
    );
  };

  return (
    <Container>
      <Row>{columns.map((column) => renderColumn(column))}</Row>
    </Container>
  );
};
