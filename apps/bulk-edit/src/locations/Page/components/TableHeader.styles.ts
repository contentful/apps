import tokens from '@contentful/f36-tokens';
import { CELL_WIDTH, STICKY_SPACER_SPACING, stickyCell } from '../styles';

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
    left: STICKY_SPACER_SPACING + CELL_WIDTH,
  },
  statusHeader: {
    ...stickyCell,
    background: tokens.gray200,
    left: STICKY_SPACER_SPACING + CELL_WIDTH * 2,
  },
  // Keyboard navigation styles
  focusedCell: {
    outline: `3px solid ${tokens.blue300}`,
    borderRadius: tokens.borderRadiusSmall,
    outlineOffset: '-3px',
  },
} as const;

// Helper function to combine cell styles
export const getCellStyle = (
  baseStyle: React.CSSProperties,
  isFocused: boolean,
  isSelected: boolean
): React.CSSProperties => {
  return {
    ...baseStyle,
    ...((isFocused || isSelected) && headerStyles.focusedCell),
  };
};
