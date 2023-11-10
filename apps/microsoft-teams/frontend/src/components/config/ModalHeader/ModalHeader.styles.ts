import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  header: css({
    borderBottom: `1px solid ${tokens.gray300}`,
    padding: `${tokens.spacingM} ${tokens.spacingL}`,
  }),
};
