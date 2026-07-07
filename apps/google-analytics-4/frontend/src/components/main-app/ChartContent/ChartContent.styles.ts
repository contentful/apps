import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  root: css({
    width: '100%',
    minHeight: '180px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: tokens.spacingXs,
  }),
};
