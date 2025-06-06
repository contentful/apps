import tokens from '@contentful/f36-tokens';

const SIDEBAR_WIDTH = 220;
const STICKY_SPACER_SPACING = 24;

export const styles = {
  sidebar: {
    minWidth: `${SIDEBAR_WIDTH}px`,
    borderRight: `1px solid ${tokens.gray200}`,
    height: '100vh',
    position: 'sticky',
    left: 0,
    top: 0,
    zIndex: 3,
    background: tokens.colorWhite,
  },
  mainContent: {
    flexGrow: 1,
  },
  table: {
    marginTop: tokens.spacingL,
    zIndex: 6,
    minWidth: '800px',
    overflowX: 'auto',
  },
  stickyCell: {
    position: 'sticky',
    left: SIDEBAR_WIDTH + STICKY_SPACER_SPACING,
    zIndex: 2,
    borderLeft: `1px solid ${tokens.gray300}`,
    borderRight: `1px solid ${tokens.gray300}`,
    minWidth: '200px',
  },
  tableHeader: {
    background: tokens.gray200,
    borderRight: `1px solid ${tokens.gray300}`,
    minWidth: '200px',
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
    zIndex: 2,
    borderRight: `1px solid ${tokens.gray300}`,
    width: '200px',
  },
  cell: {
    borderRight: `1px solid ${tokens.gray300}`,
    width: '200px',
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
    zIndex: 3,
    background: tokens.colorWhite,
    paddingBottom: tokens.spacingM,
    width: 'fit-content',
  },
  stickySpacer: {
    position: 'sticky',
    left: SIDEBAR_WIDTH,
    zIndex: 1,
    top: 0,
    background: tokens.colorWhite,
    width: STICKY_SPACER_SPACING,
    height: '100vh',
    display: 'block',
  },
} as const;
