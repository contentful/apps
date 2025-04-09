import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

export const styles = {
  lStyle: css({
    borderBottom: `1px solid ${tokens.gray300}`,
    borderLeft: `1px solid ${tokens.gray300}`,
    width: tokens.spacingL,
    position: 'relative',
    height: '24px',
    marginBottom: '16px',
  }),
  tTopStyle: css({
    borderBottom: `1px solid ${tokens.gray300}`,
    borderLeft: `1px solid ${tokens.gray300}`,
    width: tokens.spacingL,
    position: 'relative',
    height: '28px',
  }),
  tBottomStyle: css({
    borderLeft: `1px solid ${tokens.gray300}`,
    width: tokens.spacingL,
    height: '12px',
  }),
  verticalStyle: css({
    borderLeft: `1px solid ${tokens.gray300}`,
    width: tokens.spacingL,
    height: '40px',
    position: 'relative',
    right: '24px',
  }),
};
