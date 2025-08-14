import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  modalContent: css({
    height: '100%',
    gap: tokens.spacingL,
    padding: tokens.spacingL,
  }),

  gridItem: css({
    border: `1px solid ${tokens.gray200}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: tokens.spacingS,
    height: 'fit-content',
    minHeight: 'auto',
  }),

  changeBadge: css({
    marginLeft: 'auto',
  }),

  diff: css({
    // Add spacing between all HTML blocks
    '& > *': {
      marginBottom: tokens.spacingL,
    },
  }),
};
