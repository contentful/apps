import tokens from '@contentful/f36-tokens';

export const styles = {
  sidebar: {
    minWidth: '220px',
    borderRight: `1px solid ${tokens.gray200}`,
    height: '100vh',
  },
  mainContent: {
    flexGrow: 1,
  },
  table: {
    marginTop: tokens.spacingL,
    minWidth: '800px',
    overflowX: 'auto',
  },
  stickyCell: {
    position: 'sticky',
    left: 0,
    zIndex: 1,
    borderRight: `1px solid ${tokens.gray300}`,
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
} as const;
