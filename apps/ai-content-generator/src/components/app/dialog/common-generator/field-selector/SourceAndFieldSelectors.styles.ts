import { css } from '@emotion/react';
import tokens from '@contentful/f36-tokens';

export const styles = {
  wrapper: css({
    borderBottom: `1px solid ${tokens.gray300}`,
    padding: `${tokens.spacingS} ${tokens.spacingM}`,
  }),
};
