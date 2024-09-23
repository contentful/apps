import tokens from '@contentful/f36-tokens';
import { css } from '@emotion/css';

export const styles = {
  firstParagraph: css({
    marginBottom: tokens.spacingS,
  }),
  link: css({
    '> span': {
      color: tokens.blue500,
      fontWeight: 700,
    },
  }),
  zeroMarginBottom: css({
    marginBottom: 0,
  }),
  footer: css({
    margin: `${tokens.spacingXs} 0`,
  }),
};
