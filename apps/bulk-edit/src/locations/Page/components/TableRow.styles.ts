import tokens from '@contentful/f36-tokens';
import { CSSProperties } from 'react';
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
    ...((isFocused || isSelected) && rowStyles.focusedCell),
  };
};
