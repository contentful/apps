import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

export const INDENTATION_SIZE = 25;
const OFFSET = 2.75;

export const styles = {
  indentation: css({
    padding: `0 ${INDENTATION_SIZE / 2}px`,
    height: '50px', // Minimum height for lines to be visible
  }),
  vertical: css({
    borderLeft: `1px solid ${tokens.gray300}`,
    transform: `translateX(${INDENTATION_SIZE / OFFSET}px)`,
  }),
  lShaped: css({
    borderLeft: `1px solid ${tokens.gray300}`,
    borderBottom: `1px solid ${tokens.gray300}`,
    borderBottomLeftRadius: '4px',
    position: 'relative',
    transform: `translateY(-25px) translateX(${INDENTATION_SIZE / OFFSET}px)`,
  }),
  tShaped: css({
    borderLeft: `1px solid ${tokens.gray300}`,
    position: 'relative',
    transform: `translateX(${INDENTATION_SIZE / OFFSET}px)`,
    '::after': {
      backgroundColor: tokens.gray300,
      position: 'absolute',
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'block',
      content: '""',
      height: '1px',
      width: '100%',
    },
  }),
  card: css({
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: `${tokens.spacingXs} ${tokens.spacingS}`,
    backgroundColor: tokens.colorWhite,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingXs,
    flex: 1,
    minWidth: 0,
    position: 'relative',
    zIndex: 1, // Ensure card is above the connecting lines
  }),
  wrapper: css({
    display: 'flex',
    alignItems: 'center',
    marginBottom: tokens.spacingXs,
    minHeight: '50px', // Match indentation height
  }),
};
