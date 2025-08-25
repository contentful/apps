import tokens from '@contentful/f36-tokens';
import { SortMenu } from './components/SortMenu';

const SIDEBAR_WIDTH = 220;
const STICKY_SPACER_SPACING = 24;
const CELL_WIDTH = 200;
const TABLE_WIDTH = CELL_WIDTH * 4;

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
  stickyCell: {
    position: 'sticky',
    left: SIDEBAR_WIDTH + STICKY_SPACER_SPACING,
    zIndex: 1,
    borderLeft: `1px solid ${tokens.gray300}`,
    borderRight: `1px solid ${tokens.gray300}`,
    minWidth: `${CELL_WIDTH}px`,
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
  stickyTableHeader: {
    background: tokens.gray200,
    position: 'sticky',
    left: SIDEBAR_WIDTH + STICKY_SPACER_SPACING,
    zIndex: 1,
    borderRight: `1px solid ${tokens.gray300}`,
    minWidth: `${CELL_WIDTH}px`,
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
  },
  sortMenu: {
    position: 'sticky',
    left: SIDEBAR_WIDTH + STICKY_SPACER_SPACING,
    zIndex: 1,
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
} as const;
