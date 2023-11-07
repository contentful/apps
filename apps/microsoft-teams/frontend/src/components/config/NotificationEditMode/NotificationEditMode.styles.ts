import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  wrapper: css({
    height: 'auto',
    margin: `${tokens.spacingXl} auto`,
    // padding: `${tokens.spacingM}`,
    maxWidth: '900px',
    backgroundColor: tokens.colorWhite,
    borderRadius: '6px',
    border: `1px solid ${tokens.gray300}`,
    zIndex: 2,
  }),
  main: css({
    padding: `${tokens.spacingM}`,
  }),
  footer: css({
    borderTop: `1px solid ${tokens.gray300}`,
  }),
};
