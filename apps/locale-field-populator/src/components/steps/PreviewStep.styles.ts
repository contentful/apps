import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  previewSection: css({
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusMedium,
  }),
  localeList: css({
    marginTop: tokens.spacing2Xs,
    paddingLeft: tokens.spacingM,
  }),
};
