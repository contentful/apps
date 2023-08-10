import tokens from '@contentful/f36-tokens';
import { css } from '@emotion/react';

export const styles = {
  wrapper: css({
    margin: `0 ${tokens.spacingL}`,
    padding: `${tokens.spacingL} ${tokens.spacing2Xl} 0 ${tokens.spacing2Xl}`,
  }),
  button: css({
    marginRight: tokens.spacingXs,
  }),
};
