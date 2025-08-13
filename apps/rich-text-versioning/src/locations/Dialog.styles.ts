import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';
import { DIALOG_MIN_HEIGHT } from '../utils';

export const styles = {
  modalContent: css({
    height: '100%',
    minHeight: DIALOG_MIN_HEIGHT,
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
