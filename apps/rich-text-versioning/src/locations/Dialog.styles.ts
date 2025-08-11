import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

const styles = css({
  '.grid-item': {
    border: `1px solid ${tokens.gray200}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: tokens.spacingS,
    height: 'fit-content',
    minHeight: 'auto',
  },

  '.change-badge': {
    marginLeft: 'auto',
  },

  // Add spacing between all HTML blocks
  '.diff > *': {
    marginBottom: tokens.spacingL,
  },
});

export { styles };
