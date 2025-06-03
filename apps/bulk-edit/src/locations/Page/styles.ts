import tokens from '@contentful/f36-tokens';

export const styles = {
  sidebar: {
    minWidth: '220px',
    borderRight: `1px solid ${tokens.gray200}`,
    background: tokens.gray100,
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
    background: tokens.colorWhite,
    zIndex: 1,
  },
  stickyHeader: {
    position: 'sticky',
    left: 0,
    background: tokens.colorWhite,
    zIndex: 2,
  },
} as const;
