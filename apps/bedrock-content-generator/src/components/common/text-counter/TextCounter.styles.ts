import tokens from '@contentful/f36-tokens';
import { css } from '@emotion/react';

export const styles = {
  validCount: css({
    marginBottom: 0,
    color: tokens.gray700,
  }),
  invalidCount: css({
    marginBottom: 0,
    color: tokens.red500,
  }),
};
