import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  previewSection: css({
    border: '1px solidhsl(195, 18.20%, 91.40%)',
    borderRadius: '6px',
  }),
  localeList: css({
    marginTop: tokens.spacing2Xs,
    paddingLeft: tokens.spacingM,
  }),
  fieldBox: css({
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusSmall,
  }),
};
