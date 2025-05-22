import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

export const styles = {
  container: css({
    background: tokens.colorWhite,
    minHeight: '100vh',
    height: '100vh',
    width: '100%',
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusMedium,
  }),
  subheading: css({
    margin: 0,
    fontSize: tokens.fontSizeM,
  }),
  emptyComponentContainer: css({ minHeight: '80vh' }),
  buttonCell: css({
    width: '6rem',
  }),
};
