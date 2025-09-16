import tokens from '@contentful/f36-tokens';
import { CELL_WIDTH, stickyCell, STICKY_SPACER_SPACING } from '../styles';

export const rowStyles = {
  cell: {
    borderRight: `1px solid ${tokens.gray300}`,
    minWidth: `${CELL_WIDTH}px`,
  },
  displayNameCell: {
    ...stickyCell,
    borderLeft: `1px solid ${tokens.gray300}`,
    left: STICKY_SPACER_SPACING + CELL_WIDTH,
  },
  statusCell: {
    ...stickyCell,
    left: STICKY_SPACER_SPACING + CELL_WIDTH * 2,
  },
} as const;
