import { css } from '@emotion/react';
import tokens from '@contentful/f36-tokens';

export const styles = {
  header: css({
    borderBottom: `1px solid ${tokens.gray300}`,
    padding: `${tokens.spacingXs} ${tokens.spacingL}`,
  }),
};
