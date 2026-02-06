import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  container: css({
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.gray300}`,
    background: tokens.gray100,
    padding: tokens.spacingS,
    wordBreak: 'break-word',
  }),
};
