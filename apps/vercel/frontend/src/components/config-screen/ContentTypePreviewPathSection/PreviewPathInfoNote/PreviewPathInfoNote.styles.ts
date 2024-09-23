import tokens from '@contentful/f36-tokens';
import { css } from '@emotion/css';

export const styles = {
  root: css({
    display: 'flex',
    alignItems: 'center',
    marginBottom: tokens.spacingL,
  }),
  link: css({
    '> span': {
      color: tokens.blue500,
      fontWeight: 700,
    },
  }),
};
