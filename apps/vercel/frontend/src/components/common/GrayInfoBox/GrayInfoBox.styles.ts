import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

export const useStyles = (rootOptions?: {}) => ({
  root: css({
    borderRadius: tokens.borderRadiusSmall,
    ...rootOptions,
  }),
  paragraph: css({
    backgroundColor: tokens.gray200,
    color: tokens.gray700,
    fontWeight: tokens.fontWeightMedium,
    display: 'flex',
    alignItems: 'center',
    padding: `${tokens.spacing2Xs} ${tokens.spacingXs}`,
    borderRadius: tokens.borderRadiusSmall,
    gap: tokens.spacing2Xs,
    marginBottom: 0,
  }),
  copyButton: css({
    padding: 0,
    margin: 0,
    minWidth: 'auto',
    minHeight: 'auto',
  }),
});
