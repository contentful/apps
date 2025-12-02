import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  invalid: css`
    button {
      border-color: ${tokens.red600};
    }
  `,
};
