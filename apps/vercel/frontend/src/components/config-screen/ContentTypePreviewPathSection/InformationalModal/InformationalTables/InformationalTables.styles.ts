import tokens from '@contentful/f36-tokens';
import { css } from '@emotion/css';

export const styles = {
  linkParagraph: css({
    margin: `${tokens.spacingL} 0`,
  }),
  link: css({
    '> span': {
      color: tokens.blue500,
      fontWeight: 700,
    },
  }),
};
