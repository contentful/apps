import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export const styles = {
  textInput: css({ width: '250px' }),
  grid: css({ marginTop: tokens.spacingM, paddingLeft: tokens.spacingL }),
  table: css({ padding: tokens.spacingL }),
  tableCell: css({ width: '10%' }),
  pagination: css({ margin: tokens.spacingL }),
  nextButton: (page: number) => css({ marginLeft: page > 0 ? tokens.spacingL : '' }),
  selectProductsButton: css({ margin: tokens.spacingL }),
};
