import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

export const styles = {
  table: css({
    borderRadius: '0 !important',
    boxShadow: 'none !important',
    borderBottom: `1px solid ${tokens.gray200}`,
  }),

  tableRow: css({
    cursor: 'pointer',
  }),
};
