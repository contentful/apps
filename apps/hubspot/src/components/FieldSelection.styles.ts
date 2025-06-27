import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  box: css({
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusSmall,
  }),
};
