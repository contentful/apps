import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const CONFIG_SCREEN_WIDTH = '900px';
export const IMAGE_WIDTH = '566px';
export const IMAGE_HEIGHT = '245px';

export const styles = {
  body: css({
    height: 'auto',
    minHeight: '40vh',
    maxWidth: CONFIG_SCREEN_WIDTH,
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
  imageContainer: css({
    minWidth: '566px',
    minHeight: '245px',
  }),
  itemContainer: css({
    minWidth: CONFIG_SCREEN_WIDTH,
    minHeight: '245px',
  }),
};
