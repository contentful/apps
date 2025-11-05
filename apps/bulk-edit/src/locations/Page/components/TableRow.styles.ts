import tokens from '@contentful/f36-tokens';
import { CELL_WIDTH } from '../utils/constants';
import { stickyCell } from '../styles';

export const rowStyles = {
  cell: {
    borderRight: `1px solid ${tokens.gray300}`,
    minWidth: `${CELL_WIDTH}px`,
  },
  displayNameCell: {
    ...stickyCell,
    borderLeft: `1px solid ${tokens.gray300}`,
    left: 0,
  },
  statusCell: {
    ...stickyCell,
    left: CELL_WIDTH,
  },
} as const;
