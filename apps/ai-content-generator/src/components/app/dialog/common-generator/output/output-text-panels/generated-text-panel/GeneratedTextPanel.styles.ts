import { css } from '@emotion/react';
import tokens from '@contentful/f36-tokens';

export const styles = {
  panel: css({
    flexGrow: 1,
  }),
  button: css({
    marginLeft: `${tokens.spacingXs}`,
  }),
  errorMessage: css({
    color: tokens.red500,
  }),
  errorLink: css({
    color: `${tokens.red500} !important`,
    fontWeight: `${tokens.fontWeightNormal} !important`,
  }),
};
