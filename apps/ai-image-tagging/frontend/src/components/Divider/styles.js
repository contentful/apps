import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

export const styles = {
  splitter: css({
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL,
    border: 0,
    height: '1px',
    backgroundColor: tokens.gray300,
  }),
};
