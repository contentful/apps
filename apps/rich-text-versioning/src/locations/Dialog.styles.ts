import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

const sectionHeadingBase = {
  color: tokens.gray900,
  fontFamily: 'Geist',
  fontWeight: tokens.fontWeightDemiBold,
  fontSize: tokens.fontSizeXl,
  fontStyle: 'normal',
};

const styles = css({
  '.grid-item': {
    border: `1px solid ${tokens.gray200}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: tokens.spacingS,
    height: 'fit-content',
    minHeight: 'auto',
  },

  '.section-heading-base': {
    ...sectionHeadingBase,
  },

  '.section-heading-margin': {
    ...sectionHeadingBase,
    marginBottom: tokens.spacingL,
  },

  '.change-badge': {
    marginLeft: 'auto',
  },
});

export { styles };
