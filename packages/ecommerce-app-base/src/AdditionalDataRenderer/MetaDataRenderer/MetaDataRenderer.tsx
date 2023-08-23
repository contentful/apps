import * as React from 'react';
import { FC, ReactNode } from 'react';
import { Box, Caption } from '@contentful/f36-components';
import { Row } from './Row';
import { Column } from './Column';
import { Container } from '../Container';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

type ItemData = {
  name: string;
  value: string | ReactNode;
};

export type ColumnData = {
  title: string;
  items: Array<ItemData>;
  footer?: () => ReactNode;
};

export type MetaDataProps = {
  columns: Array<ColumnData>;
  footer?: () => ReactNode;
};

const styles = {
  name: css({
    marginRight: tokens.spacingXs,
    color: tokens.gray700,
  }),
};

export const MetaDataRenderer: FC<MetaDataProps> = ({ columns, footer }) => {
  const renderMetaRow = (row: ItemData) => {
    return (
      <Box key={row.name} role={'listItem'} marginBottom={'spacing2Xs'}>
        <Caption>
          <span className={styles.name}>{row.name}:</span> {row.value}
        </Caption>
      </Box>
    );
  };

  const renderColumn = ({ items, footer, title }: ColumnData) => {
    return (
      <Column key={title}>
        <Caption as={'h3'} fontWeight={'fontWeightMedium'} marginBottom={'spacingM'}>
          {title}
        </Caption>
        {items.map((row) => renderMetaRow(row))}

        {!!footer && (
          <Box key={'footer'} role={'listItem'} marginBottom={'spacing2Xs'}>
            {footer()}
          </Box>
        )}
      </Column>
    );
  };

  return (
    <Container>
      <Row>{columns.map((column) => renderColumn(column))}</Row>
      {!!footer && footer()}
    </Container>
  );
};
