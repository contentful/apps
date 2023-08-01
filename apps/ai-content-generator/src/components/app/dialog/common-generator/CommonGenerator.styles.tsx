import tokens from '@contentful/f36-tokens';
import { css } from '@emotion/react';

export const styles = {
  fieldSelectorRoot: css({
    borderLeft: `1px solid ${tokens.gray200}`,
    borderRight: `1px solid ${tokens.gray200}`,
    flexGrow: 1,
  }),
  root: css({
    display: 'flex',
    flexDirection: 'column',
  }),
};
