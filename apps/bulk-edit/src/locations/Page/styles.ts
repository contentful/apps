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

export const whiteBox: CSSProperties = {
  background: tokens.colorWhite,
  borderRadius: tokens.borderRadiusMedium,
};

export const styles = {
  mainContent: {
    flexGrow: 1,
    minWidth: 0,
    paddingLeft: tokens.spacingL,
    paddingRight: tokens.spacingL,
  },
  mainContentBody: {
    paddingTop: tokens.spacingL,
    minWidth: 0,
    ...whiteBox,
  },
  tableContainer: {
    flex: 1,
    flexDirection: 'column',
    minWidth: 0,
    overflow: 'hidden',
    position: 'relative',
    paddingRight: tokens.spacingM,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255, 255, 255, 0.3)',
    zIndex: 1000,
  },
  whiteBox,
  pageHeader: {
    background: tokens.colorWhite,
    width: 'fit-content',
  },
  spacer: {
    background: tokens.colorWhite,
    width: SPACER_SPACING,
    display: 'block',
    marginRight: tokens.spacing2Xs,
    flexShrink: 0, // Spacer is inside a flex container and should not shrink
    minHeight: `calc(100vh - ${tokens.spacingL})`,
  },
  sortMenu: {
    width: 'fit-content',
  },
  sortMenuList: {
    width: 'fit-content',
  },

  editButton: {
    width: '100%',
    marginTop: tokens.spacingXs,
    marginBottom: tokens.spacingM,
    alignItems: 'center',
    gap: tokens.spacingS,
  },
  errorNote: {
    maxWidth: `${TABLE_WIDTH}px`,
    marginTop: tokens.spacingM,
  },
  loadingTableBorder: {
    width: '100%',
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
