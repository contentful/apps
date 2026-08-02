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
  generatingContainer: css({
    height: '100%',
    paddingLeft: tokens.spacing2Xl,
    paddingRight: tokens.spacing2Xl,
  }),
};
