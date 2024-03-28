import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

export const styles = {
  firstParagraph: css({
    marginBottom: tokens.spacingS,
  }),
  zeroMarginBottom: css({
    marginBottom: 0,
  }),
  footer: css({
    margin: `${tokens.spacingL} 0`,
  }),
};
