import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  card: css({
    height: 'auto',
    margin: `${tokens.spacingL} auto`,
    maxWidth: '900px',
    backgroundColor: tokens.colorWhite,
    borderRadius: '6px',
    border: `1px solid ${tokens.gray300}`,
    zIndex: 2,
    padding: `${tokens.spacingL}`,
  }),
  copyButton: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '20px',

    border: 'none',
    backgroundColor: 'transparent',
    transform: 'translateX(-10px)',
    boxShadow: 'none',
    opacity: '0',
    transition: `all ${tokens.transitionDurationDefault} ${tokens.transitionEasingCubicBezier}`,
    '&:hover': css({
      backgroundColor: 'transparent',
      border: 'none',
      opacity: '1',
      transform: 'translateX(0)',
    }),
  }),
  sysId: css({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    [`&:hover button`]: css({
      opacity: '1',
      transform: 'translateX(0)',
    }),
  }),
  id: css({
    fontFamily: tokens.fontStackMonospace,
    fontSize: tokens.fontSizeS,
    lineHeight: tokens.lineHeightS,
    color: tokens.gray700,
  }),
};
