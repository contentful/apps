import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  productCard: css({
    marginTop: tokens.spacingXs,
    marginBottom: tokens.spacingXs,
    '&&:hover': {
      borderColor: tokens.colorPrimary,
      cursor: 'pointer',
    },
  }),
};
