import tokens from '@contentful/f36-tokens';
import { stickyCell } from '../styles';
import { CELL_WIDTH } from '../utils/constants';

export const headerStyles = {
  tableHead: {
    borderTop: `transparent`,
  },
  stickyTableRow: {
    background: tokens.colorWhite,
    position: 'sticky',
    top: 0,
    zIndex: 2,
  },
  tableHeader: {
    background: tokens.gray200,
    borderRight: `1px solid ${tokens.gray300}`,
    minWidth: `${CELL_WIDTH}px`,
  },
  stickyHeader: {
    background: tokens.gray200,
    position: 'sticky',
    left: 0,
    borderTop: `transparent`,
  },
  displayNameHeader: {
    ...stickyCell,
    background: tokens.gray200,
    left: 0,
  },
  statusHeader: {
    ...stickyCell,
    background: tokens.gray200,
    left: CELL_WIDTH,
  },
} as const;
