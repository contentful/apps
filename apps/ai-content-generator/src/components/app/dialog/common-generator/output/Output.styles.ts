import { css } from '@emotion/react';
import tokens from '@contentful/f36-tokens';

const TAB_WIDTH = 145;

export const styles = {
  wrapper: css({
    margin: `0 ${tokens.spacingL}`,
  }),
  tabsContainer: css({
    width: '100%',
  }),
  tabsList: css({
    justifyContent: 'flex-end',
    padding: `${tokens.spacingS} ${tokens.spacing2Xl} 0 ${tokens.spacing2Xl}`,
  }),
  tab: css({
    width: TAB_WIDTH,
    justifyContent: 'center',
  }),
};
