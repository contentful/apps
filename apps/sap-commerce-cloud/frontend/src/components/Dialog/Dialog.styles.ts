import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  textInput: css({ width: '250px' }),
  grid: css({ margin: `${tokens.spacingM} 0`, paddingLeft: tokens.spacingL }),
  table: css({ padding: tokens.spacingL }),
  tableCell: css({ width: '10%' }),
  pagination: css({ margin: tokens.spacingL }),
  nextButton: (page: number) =>
    css({ marginLeft: page > 0 ? tokens.spacingL : '' }),
  selectProductsButton: css({ margin: tokens.spacingL }),
};
