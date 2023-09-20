import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

export const styles = {
  link: css({
    color: tokens.gray900,
  }),
  wrapper: css({
    'p:last-child': {
      marginTop: 0,
    },
  }),
  button: css({
    marginTop: 20,
  }),
  box: css({
    display: 'inline-block',
    boxShadow: '0 10px 10px rgba(0, 0, 0, 0.1)',
    borderRadius: '4px',
  }),
};
