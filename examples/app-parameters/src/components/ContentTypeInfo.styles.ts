import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

export const styles = {
  copyButtonWrapper: css({
    margin: `0 ${tokens.spacingS}`,
  }),
  copyIDButton: css({
    fontFamily: tokens.fontStackMonospace,
    color: tokens.gray500,
    svg: {
      fill: 'currentColor',
    },
  }),
};
