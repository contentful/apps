import { css } from '@emotion/react';
import tokens from '@contentful/f36-tokens';

export const styles = {
  table: css({
    borderRadius: 'none !important',
    boxShadow: 'none !important',
    borderBottom: `1px solid ${tokens.gray200}`,
  }),
  selectAll: css`
    label {
      color: ${tokens.gray700};
      font-size: ${tokens.fontSizeS};
    }
  `,
};
