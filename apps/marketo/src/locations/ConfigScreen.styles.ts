import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  container: css({
    width: '900px',
    padding: tokens.spacingL,
  }),
  textLinkContainer: css({
    marginTop: tokens.spacingXs,
  }),
  connectionCard: css({
    paddingTop: tokens.spacingXs,
    paddingBottom: tokens.spacingXs,
    paddingLeft: tokens.spacingS,
    paddingRight: tokens.spacingS,
    borderRadius: tokens.borderRadiusSmall,
  }),
};
