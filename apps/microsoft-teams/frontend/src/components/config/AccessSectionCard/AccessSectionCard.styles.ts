import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

export const styles = {
  orgLogo: css({
    // Setting size to default size for favicon in MS organizational branding
    height: 32,
    marginRight: tokens.spacingM,
  }),
  cardError: css({
    borderColor: tokens.colorNegative,
  }),
  errorText: css({
    color: tokens.colorNegative,
  }),
  username: css({
    fontWeight: tokens.fontWeightDemiBold,
  }),
};
