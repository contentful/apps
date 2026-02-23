import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  added: css({
    backgroundColor: tokens.green100,
    color: tokens.green600,
    borderRadius: tokens.borderRadiusSmall,
    padding: '0 2px',
  }),
  removed: css({
    backgroundColor: tokens.red100,
    color: tokens.red600,
    textDecoration: 'line-through',
    borderRadius: tokens.borderRadiusSmall,
    padding: '0 2px',
  }),
};
