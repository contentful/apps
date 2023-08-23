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

type ItemRendererData = () => ReactNode;

export type ColumnData = {
  title: string;
  items: Array<ItemData | ItemRendererData>;
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

const isItemRendererData = (item: ItemData | ItemRendererData): item is ItemRendererData => {
  return typeof item === 'function';
};

export const MetaDataRenderer: FC<MetaDataProps> = ({ columns, footer }) => {
  const renderMetaRow = (item: ItemData | ItemRendererData) => {
    return (
      <Box key={item.name} role={'listItem'} marginBottom={'spacing2Xs'}>
        {isItemRendererData(item) ? (
          item()
        ) : (
          <Caption>
            <span className={styles.name}>{item.name}:</span> {item.value}
          </Caption>
        )}
      </Box>
    );
  };

  const renderColumn = ({ items, title }: ColumnData) => {
    return (
      <Column key={title}>
        <Caption as={'h3'} fontWeight={'fontWeightMedium'} marginBottom={'spacingM'}>
          {title}
        </Caption>
        {items.map((row) => renderMetaRow(row))}
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
