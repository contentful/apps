import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

const styles = css({
  '& ins': {
    backgroundColor: tokens.green100,
    color: tokens.green600,
    textDecoration: 'none',
  },

  '& del': {
    backgroundColor: tokens.red100,
    color: tokens.red600,
    textDecoration: 'line-through',
  },

  // Add spacing between all HTML blocks
  '& > *': {
    marginBottom: tokens.spacingL,
  },
});

export { styles };
