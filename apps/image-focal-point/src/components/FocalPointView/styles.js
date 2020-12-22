import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export const styles = {
  container: css({
    display: 'flex',
    alignItems: 'center'
  }),
  input: css({
    maxWidth: '280px'
  }),
  button: css({
    marginLeft: tokens.spacingXs,
    marginRight: tokens.spacingXs
  })
};
