import tokens from '@contentful/f36-tokens';
import { CSSProperties } from 'react';
import {
  CELL_WIDTH,
  FILTER_MULTISELECT_WIDTH,
  SIDEBAR_WIDTH,
  SPACER_SPACING,
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
    background: tokens.colorWhite,
  },
  mainContent: {
    flexGrow: 1,
    minWidth: 0,
  },
  tableContainer: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  whiteBox: {
    background: tokens.colorWhite,
    borderRadius: tokens.borderRadiusMedium,
  },
  pageHeader: {
    background: tokens.colorWhite,
    paddingBottom: tokens.spacingM,
    width: 'fit-content',
  },
  spacer: {
    background: tokens.colorWhite,
    width: SPACER_SPACING,
    height: '100vh',
    display: 'block',
    marginRight: tokens.spacing2Xs,
    flexShrink: 0, // Spacer is inside a flex container and should not shrink
  },
  sortMenu: {
    width: 'fit-content',
  },
  sortMenuList: {
    width: 'fit-content',
  },
  paginationContainer: {
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
    width: 'fit-content',
    marginBottom: tokens.spacingS,
  },
  errorNote: {
    maxWidth: `${TABLE_WIDTH}px`,
    marginTop: tokens.spacingM,
  },
  loadingTableBorder: {
    border: `1px solid ${tokens.gray200}`,
  },
  columnMultiselectStatuses: {
    minWidth: FILTER_MULTISELECT_WIDTH,
  },
  columnMultiselectColumns: {
    minWidth: FILTER_MULTISELECT_WIDTH,
  },
  resetFiltersButton: {
    width: 'fit-content',
  },
} as const;
