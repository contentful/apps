import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

export const styles = {
  container: css({
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  }),
  input: css({
    maxWidth: '280px',
  }),
  button: css({
    marginLeft: tokens.spacingXs,
    marginRight: tokens.spacingXs,
  }),
};
