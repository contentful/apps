import { css } from '@emotion/react';
import tokens from '@contentful/f36-tokens';

export const styles = {
  container: css({
    height: '100%',
  }),
  textarea: css({
    flexGrow: 1,
  }),
  helpText: css({
    display: 'flex',
    alignItems: 'center',
    color: `${tokens.gray500}`,
    margin: `0 ${tokens.spacingS}`,
  }),
};
