import tokens from '@contentful/f36-tokens';
import { CSSProperties } from 'react';

const SIDEBAR_WIDTH = 200;
const STICKY_SPACER_SPACING = 24;
const CELL_WIDTH = 200;
const TABLE_WIDTH = CELL_WIDTH * 4;
const BUTTON_WIDTH = 124;

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
  noEntriesText: {
    textAlign: 'start',
    fontWeight: 'bold',
    fontSize: tokens.fontSizeL,
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
  columnMultiselect: {
    position: 'sticky',
    left: SIDEBAR_WIDTH + STICKY_SPACER_SPACING + BUTTON_WIDTH,
    zIndex: 1,
    minWidth: '300px',
  },
  statusBadge: {
    marginRight: tokens.spacingXs,
  },
  focusedBadge: {
    border: `2px solid ${tokens.blue300}`,
    outline: 'none',
  },
  focusedHeader: {
    border: `2px solid ${tokens.blue300}`,
    outline: 'none',
    borderRadius: tokens.borderRadiusSmall,
  },
} as const;
