import { CSSProperties } from 'react';
import tokens from '@contentful/f36-tokens';
import { ITEMS_PER_PAGE } from '../utils/consts';

export const tableContainerStyles = {
  minHeight: `${64 + ITEMS_PER_PAGE * 48}px`,
};

export const cellWithWidth = (width: string, style?: CSSProperties): CSSProperties => ({
  verticalAlign: 'middle',
  width,
  minWidth: tokens.spacing2Xl,
  ...style,
});

export const redirectsTableStyles = {
  sourceColumn: cellWithWidth('22%', { padding: tokens.spacingXs }),
  destinationColumn: cellWithWidth('22%', { padding: tokens.spacingXs }),
  reasonColumn: cellWithWidth('24%', { padding: tokens.spacingXs }),
  typeColumn: cellWithWidth('12%', { padding: tokens.spacingXs }),
  statusColumn: cellWithWidth('10%', { padding: tokens.spacingXs }),
  createdColumn: cellWithWidth('10%', { padding: tokens.spacingXs }),
  actionsColumn: cellWithWidth('10%', { padding: tokens.spacingXs }),
  linkStyles: {
    color: tokens.colorBlack,
    textDecoration: 'none',
  },
};
