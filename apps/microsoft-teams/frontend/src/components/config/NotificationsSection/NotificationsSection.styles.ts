import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  box: css({
    height: 'auto',
    margin: `${tokens.spacingXl} auto`,
    padding: `${tokens.spacingXl} ${tokens.spacing2Xl}`,
    maxWidth: '900px',
    backgroundColor: tokens.colorWhite,
    borderRadius: '6px',
    border: `1px solid ${tokens.gray300}`,
    zIndex: 2,
  }),
};
