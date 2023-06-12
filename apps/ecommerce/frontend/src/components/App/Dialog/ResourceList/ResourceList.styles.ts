import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  productList: css({
    display: 'flex',
    flexWrap: 'wrap',
    marginLeft: tokens.spacingXs,
    marginRight: tokens.spacingXs,
    paddingBottom: tokens.spacingM,
  }),
};
