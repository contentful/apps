import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

export const styles = {
  container: css({
    height: 'auto',
    boxShadow: tokens.boxShadowDefault,
    minHeight: '40vh',
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusMedium,
    width: '100%',
  }),
  subheading: css({
    margin: 0,
    fontSize: tokens.fontSizeM,
  }),
};
