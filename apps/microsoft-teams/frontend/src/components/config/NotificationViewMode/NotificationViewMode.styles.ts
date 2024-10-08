import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

export const styles = {
  wrapper: css({
    height: 'auto',
    margin: `${tokens.spacingXs} auto`,
    maxWidth: '900px',
    backgroundColor: tokens.colorWhite,
    borderRadius: '6px',
    border: `1px solid ${tokens.gray300}`,
    zIndex: 2,
    padding: `${tokens.spacingM}`,
  }),
};
