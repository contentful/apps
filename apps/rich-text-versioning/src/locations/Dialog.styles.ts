import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

const sectionHeadingBase = {
  color: tokens.gray900,
  fontFamily: 'Geist',
  fontWeight: tokens.fontWeightDemiBold,
  fontSize: tokens.fontSizeXl,
  fontStyle: 'normal',
};

export const styles = {
  modalContent: css({
    height: '100%',
    minHeight: '500px',
    padding: tokens.spacingL,
  }),

  gridItem: css({
    border: `1px solid ${tokens.gray200}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: tokens.spacingS,
    height: 'fit-content',
    minHeight: 'auto',
  }),

  sectionHeadingBase: css({
    ...sectionHeadingBase,
  }),

  sectionHeadingMargin: css({
    ...sectionHeadingBase,
    marginBottom: tokens.spacingL,
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
