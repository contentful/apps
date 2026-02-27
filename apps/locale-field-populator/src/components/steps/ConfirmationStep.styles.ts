import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  container: css({
    textAlign: 'center',
    padding: tokens.spacingXl,
  }),
  iconSuccess: css({
    color: tokens.green500,
    marginBottom: tokens.spacingM,
  }),
  iconError: css({
    color: tokens.red500,
    marginBottom: tokens.spacingM,
  }),
};
