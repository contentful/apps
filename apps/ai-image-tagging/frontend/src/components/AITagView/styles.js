import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

export const styles = {
  inputWrapper: css({
    marginTop: tokens.spacingXs,
  }),
  pillWrapper: css({
    marginTop: tokens.spacingXs,
    marginBottom: tokens.spacingL,
  }),
  pill: css({
    marginRight: tokens.spacingS,
    marginTop: tokens.spacingXs,
  }),
  btn: css({
    marginRight: tokens.spacingM,
  }),
  fileWarning: css({
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingM,
  }),
};
