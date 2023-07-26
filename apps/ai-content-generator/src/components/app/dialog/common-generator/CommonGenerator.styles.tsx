import tokens from '@contentful/f36-tokens';
import { DIALOG_MIN_HEIGHT } from '@configs/dialog/dialogConfig';
import { css } from '@emotion/react';

export const styles = {
  fieldSelectorRoot: css({
    borderLeft: `1px solid ${tokens.gray200}`,
    borderRight: `1px solid ${tokens.gray200}`,
    flexGrow: 1,
  }),
  root: css({
    display: 'flex',
    minHeight: DIALOG_MIN_HEIGHT,
  }),
};
