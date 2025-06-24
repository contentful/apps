import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  body: css({
    height: 'auto',
    minHeight: '40vh',
    maxWidth: '900px',
    marginTop: tokens.spacing2Xl,
    marginBottom: tokens.spacing2Xl,
  }),
  orderList: css({ paddingLeft: 20, marginBottom: 0, marginTop: 0, color: tokens.gray500 }),
  listItem: css({ marginBottom: 4 }),
  dropdownItem: css({
    width: '100%',
    margin: 0,
    padding: tokens.spacing2Xs,
  }),
};
