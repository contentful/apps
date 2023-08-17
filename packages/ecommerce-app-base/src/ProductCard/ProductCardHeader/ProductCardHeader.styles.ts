import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  productCardHeader: css({
    padding: `${tokens.spacingXs} ${tokens.spacingS}`,
    borderBottom: `1px solid ${tokens.gray200}`,
  }),
};
