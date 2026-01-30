import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

const INDENTATION_SIZE = 24;
const OFFSET = 8;

export const indentationStyles = {
  indentation: css({
    width: `${INDENTATION_SIZE}px`,
    flexShrink: 0,
  }),
  vertical: css({
    borderLeft: `1px solid ${tokens.gray300}`,
    paddingTop: tokens.spacingS,
    marginTop: `-${tokens.spacingS}`,
    transform: `translateX(${OFFSET}px)`,
  }),
  lShaped: css({
    position: 'relative',
    transform: `translateX(${OFFSET}px)`,
    zIndex: 0,
    '&::before': {
      content: '""',
      position: 'absolute',
      top: `-${tokens.spacingS}`,
      bottom: '50%',
      width: '1px',
      backgroundColor: tokens.gray300,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '50%',
      height: '1px',
      width: `${INDENTATION_SIZE - OFFSET}px`,
      backgroundColor: tokens.gray300,
    },
  }),
  tShaped: css({
    borderLeft: `1px solid ${tokens.gray300}`,
    position: 'relative',
    transform: `translateX(${OFFSET}px) `,
    paddingTop: tokens.spacingS,
    marginTop: `-${tokens.spacingS}`,
    '&::after': {
      content: '""',
      backgroundColor: tokens.gray300,
      position: 'absolute',
      top: '62%',
      height: '1px',
      width: `${INDENTATION_SIZE - OFFSET}px`,
    },
  }),
};
