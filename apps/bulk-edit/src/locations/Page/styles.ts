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

export const stickyCell: CSSProperties = {
  position: 'sticky',
  zIndex: 1,
  borderRight: `1px solid ${tokens.gray300}`,
  minWidth: `${CELL_WIDTH}px`,
};

export const focusedCell: CSSProperties = {
  outline: `3px solid ${tokens.blue300}`,
  borderRadius: tokens.borderRadiusSmall,
  outlineOffset: '-3px',
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
  whiteBox: {
    background: tokens.colorWhite,
    borderRadius: tokens.borderRadiusMedium,
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
    flexShrink: 0, // Spacer is inside a flex container and should not shrink
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
    padding: `${tokens.spacingXs} 0`,
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
} as const;
