import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  container: css({
    position: 'relative',
    width: '100%',
  }),
  deleteButton: css({
    position: 'absolute',
    right: `-${tokens.spacing4Xl}`,
    top: 0,
  }),
};
