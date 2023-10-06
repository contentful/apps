import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

export const styles = {
  header: css({
    marginBottom: tokens.spacingS,
  }),
  link: css({
    color: tokens.gray900,
    margin: 0,
  }),
  wrapper: css({
    'p:last-child': {
      marginTop: 0,
    },
  }),
};
