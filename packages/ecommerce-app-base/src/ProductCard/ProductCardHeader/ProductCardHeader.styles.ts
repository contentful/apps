import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  productCardHeader: css({
    borderBottom: `1px solid ${tokens.gray200}`,
  }),
  badge: css({
    padding: `${tokens.spacingXs} ${tokens.spacingM}`,
  }),
};
