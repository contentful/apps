import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

export const BUTTON_ESTIMATE_WIDTH_PX = 280;

const action = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: tokens.spacing2Xs,
  border: 'none',
  cursor: 'pointer',
  fontSize: tokens.fontSizeS,
  fontWeight: tokens.fontWeightMedium,
  padding: `${tokens.spacing2Xs} ${tokens.spacingS}`,
  whiteSpace: 'nowrap',
});

export const editAction = css([
  action,
  {
    color: tokens.gray900,
    backgroundColor: tokens.colorWhite,
    '&:hover': {
      backgroundColor: tokens.gray200,
    },
  },
]);

export const removeAction = css([
  action,
  {
    color: tokens.red600,
    backgroundColor: tokens.gray100,
    '&:hover': {
      backgroundColor: tokens.gray200,
    },
  },
]);

export const divider = css({
  width: 1,
  alignSelf: 'stretch',
  backgroundColor: tokens.gray300,
});

export const getMenuPosition = (top: number, left: number) =>
  css({
    display: 'inline-flex',
    alignItems: 'stretch',
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.gray300}`,
    backgroundColor: tokens.colorWhite,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    position: 'fixed',
    top,
    left,
    transform: 'translateX(-50%)',
    zIndex: 3,
  });
