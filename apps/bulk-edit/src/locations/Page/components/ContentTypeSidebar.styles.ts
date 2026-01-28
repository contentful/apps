import tokens from '@contentful/f36-tokens';
import { SIDEBAR_WIDTH } from '../utils/constants';

export const styles = {
  sidebar: {
    minWidth: `${SIDEBAR_WIDTH}px`,
    borderRight: `1px solid ${tokens.gray200}`,
    background: tokens.colorWhite,
    flexDirection: 'column',
  },
  sidebarTitle: {
    color: tokens.gray600,
    padding: `${tokens.spacingS} ${tokens.spacingM}`,
  },
  noContentTypeText: {
    fontWeight: 'bold',
    padding: `${tokens.spacingXl} 0 ${tokens.spacingM} ${tokens.spacingM}`,
  },
  sidebarContent: {
    flex: 1,
    position: 'relative',
  },
  sidebarList: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflowY: 'auto',
    padding: `0 ${tokens.spacingM} ${tokens.spacingM} ${tokens.spacingM}`,
  },
} as const;
