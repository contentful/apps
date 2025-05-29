import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

const baseSubheadingStyle = {
  margin: 0,
  color: tokens.gray500,
  fontSize: tokens.fontSizeM,
};

export const styles = {
  subheading: css({
    ...baseSubheadingStyle,
  }),
  subheadingCard: css({
    ...baseSubheadingStyle,
    fontWeight: tokens.fontWeightMedium,
  }),
  card: css({
    padding: tokens.spacingXs,
    marginBottom: tokens.spacingS,
  }),
  stack: css({
    maxHeight: '176px',
    overflowY: 'auto',
  }),
  listItem: css({
    color: tokens.gray500,
  }),
};
