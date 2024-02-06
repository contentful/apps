import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  table: css({
    borderRadius: 'none !important',
    boxShadow: 'none !important',
    borderBottom: `1px solid ${tokens.gray200}`,
  }),
  tableRow: css({
    // width as determined by design
    width: '53%',
  }),
  tableCell: css({
    paddingBottom: 0,
    paddingTop: tokens.spacingS,
  }),
};
