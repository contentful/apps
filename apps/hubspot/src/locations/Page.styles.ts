import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

export const styles = {
  container: css({
    background: tokens.colorWhite,
    minHeight: '100vh',
    width: '100%',
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusMedium,
  }),
  emptyComponentContainer: css({ minHeight: '80vh' }),
  loading: css({
    height: '80vh',
  }),
  errorBanner: css({
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL,
    borderRadius: tokens.spacingXs,
    fontWeight: 'normal',
  }),
};
