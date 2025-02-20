import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  wrapper: css({
    width: '100%',
  }),
  table: css({
    borderRadius: 'none !important',
    boxShadow: 'none !important',
    borderBottom: `1px solid ${tokens.gray200}`,
  }),
};
