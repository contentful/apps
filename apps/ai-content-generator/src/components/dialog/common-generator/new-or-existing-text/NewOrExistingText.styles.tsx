import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  button: css({
    border: 'none',
    borderRadius: 0,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingLeft: tokens.spacingM,
    paddingRight: tokens.spacingM,
    paddingTop: tokens.spacingXs,
    paddingBottom: tokens.spacing2Xs
  }),
};
