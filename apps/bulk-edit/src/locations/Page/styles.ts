import tokens from '@contentful/f36-tokens';
import { CSSProperties } from 'react';
import {
  BUTTON_WIDTH,
  CELL_WIDTH,
  FILTER_MULTISELECT_WIDTH,
  GAP_BETWEEN_BUTTON,
  SIDEBAR_WIDTH,
  STICKY_SPACER_SPACING,
  TABLE_WIDTH,
} from './utils/constants';

const stickyCell: CSSProperties = {
  position: 'sticky',
  zIndex: 1,
  borderRight: `1px solid ${tokens.gray300}`,
  minWidth: `${CELL_WIDTH}px`,
};

export const styles = {
  sidebar: {
    minWidth: `${SIDEBAR_WIDTH}px`,
    borderRight: `1px solid ${tokens.gray200}`,
    height: '100vh',
    position: 'sticky',
    left: 0,
    top: 0,
    zIndex: 4,
    background: tokens.colorWhite,
  },
  mainContent: {
    flexGrow: 1,
  },
  table: {
    marginTop: tokens.spacingM,
    minWidth: `${CELL_WIDTH * 4}px`,
    overflowX: 'auto',
    outline: 'none', // Remove default focus outline
  },
  tableFocused: {
    marginTop: tokens.spacingM,
    minWidth: `${CELL_WIDTH * 4}px`,
    overflowX: 'auto',
    outline: `2px solid ${tokens.blue500}`,
    outlineOffset: '2px',
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
  displayNameCell: {
    ...stickyCell,
    borderLeft: `1px solid ${tokens.gray300}`,
    left: STICKY_SPACER_SPACING + CELL_WIDTH,
  },
  statusCell: {
    ...stickyCell,
    left: STICKY_SPACER_SPACING + CELL_WIDTH * 2,
  },
  stickyTableRow: {
    background: tokens.colorWhite,
    position: 'sticky',
    top: 0,
    zIndex: 2,
  },
  cell: {
    borderRight: `1px solid ${tokens.gray300}`,
    minWidth: `${CELL_WIDTH}px`,
  },
  whiteBox: {
    background: tokens.colorWhite,
    borderRadius: tokens.borderRadiusMedium,
  },
  tableHead: {
    borderTop: `transparent`,
  },
  stickyPageHeader: {
    position: 'sticky',
    left: SIDEBAR_WIDTH + STICKY_SPACER_SPACING,
    zIndex: 1,
    background: tokens.colorWhite,
    paddingBottom: tokens.spacingM,
    width: 'fit-content',
  },
  stickySpacer: {
    position: 'sticky',
    left: SIDEBAR_WIDTH,
    zIndex: 3,
    top: 0,
    background: tokens.colorWhite,
    width: STICKY_SPACER_SPACING,
    height: '100vh',
    display: 'block',
    marginRight: tokens.spacing2Xs,
  },
  sortMenu: {
    position: 'sticky',
    left: SIDEBAR_WIDTH + STICKY_SPACER_SPACING,
    zIndex: 1,
    width: 'fit-content',
  },
  sortMenuList: {
    width: 'fit-content',
  },
  paginationContainer: {
    position: 'sticky',
    left: SIDEBAR_WIDTH + STICKY_SPACER_SPACING,
    zIndex: 1,
    background: tokens.colorWhite,
    paddingBottom: tokens.spacingM,
    maxWidth: `81vw`,
    marginTop: tokens.spacingL,
    marginRight: tokens.spacingXs,
  },
  noContentTypeText: {
    fontWeight: 'bold',
  },
  editButton: {
    position: 'sticky',
    left: SIDEBAR_WIDTH + STICKY_SPACER_SPACING,
    zIndex: 1,
    width: 'fit-content',
  },
  errorNote: {
    maxWidth: `${TABLE_WIDTH}px`,
    marginTop: tokens.spacingM,
    position: 'sticky',
    left: SIDEBAR_WIDTH + STICKY_SPACER_SPACING,
    zIndex: 1,
  },
  loadingTableBorder: {
    border: `1px solid ${tokens.gray200}`,
  },
  columnMultiselectStatuses: {
    position: 'sticky',
    left: SIDEBAR_WIDTH + STICKY_SPACER_SPACING + GAP_BETWEEN_BUTTON + BUTTON_WIDTH,
    zIndex: 1,
    minWidth: FILTER_MULTISELECT_WIDTH,
  },
  columnMultiselectColumns: {
    position: 'sticky',
    left:
      SIDEBAR_WIDTH +
      STICKY_SPACER_SPACING +
      GAP_BETWEEN_BUTTON +
      BUTTON_WIDTH +
      GAP_BETWEEN_BUTTON +
      FILTER_MULTISELECT_WIDTH,
    zIndex: 1,
    minWidth: FILTER_MULTISELECT_WIDTH,
  },
  resetFiltersButton: {
    position: 'sticky',
    left:
      SIDEBAR_WIDTH +
      STICKY_SPACER_SPACING +
      GAP_BETWEEN_BUTTON +
      BUTTON_WIDTH +
      GAP_BETWEEN_BUTTON +
      FILTER_MULTISELECT_WIDTH +
      GAP_BETWEEN_BUTTON +
      FILTER_MULTISELECT_WIDTH,
    zIndex: 1,
    width: 'fit-content',
  },
  // Keyboard navigation styles
  focusedCell: {
    outline: `2px solid ${tokens.blue600}`,
    outlineOffset: '-2px',
  },
  selectedCell: {
    background: tokens.blue100,
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
    ...(isFocused && styles.focusedCell),
    ...(isSelected && styles.selectedCell),
  };
};
