import { CSSProperties } from 'react';
import { cellWithWidth } from './utils/tableStylesUtils';

export const styles = {
  emptyState: {
    minHeight: '280px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,
  titleCell: cellWithWidth('25%'),
  dateCell: cellWithWidth('20%'),
  itemsCell: cellWithWidth('10%'),
  updatedCell: cellWithWidth('20%'),
  userCell: cellWithWidth('15%'),
  actionsCell: cellWithWidth('10%'),
};
