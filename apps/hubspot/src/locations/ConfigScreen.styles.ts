import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  body: css({
    height: 'auto',
    minHeight: '40vh',
    maxWidth: '900px',
    marginTop: tokens.spacing2Xl,
  }),
  orderList: css({ paddingLeft: 20, marginBottom: 0, marginTop: 0, color: tokens.gray500 }),
  listItem: css({ marginBottom: 4 }),
};
