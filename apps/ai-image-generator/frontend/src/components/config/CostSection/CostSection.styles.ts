import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

export const styles = {
  link: css({
    color: tokens.gray900
  }),
  wrapper: css({
    'p:last-child': {
        marginTop: 0
    }
  })
};
