import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

export const reviewHeaderActions = css({
  alignItems: 'center',
  display: 'inline-flex',
  flexShrink: 0,
  gap: tokens.spacingXs,
});

export const modeToggleWrapper = css({
  alignItems: 'center',
  backgroundColor: tokens.gray100,
  border: `1px solid ${tokens.gray300}`,
  borderRadius: tokens.borderRadiusMedium,
  display: 'inline-flex',
  gap: '2px',
  padding: '1px',
});

export const modeToggleButton = css({
  alignItems: 'center',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: `calc(${tokens.borderRadiusMedium} - 2px)`,
  color: tokens.gray700,
  cursor: 'pointer',
  display: 'inline-flex',
  fontSize: tokens.fontSizeS,
  fontWeight: tokens.fontWeightDemiBold,
  gap: tokens.spacingXs,
  height: '28px',
  lineHeight: tokens.lineHeightDefault,
  padding: `0 ${tokens.spacingS}`,
  transition: 'background-color 100ms ease, box-shadow 100ms ease, color 100ms ease',
  whiteSpace: 'nowrap',

  '& svg': {
    flexShrink: 0,
  },

  '&:hover': {
    backgroundColor: tokens.colorWhite,
    color: tokens.gray900,
  },

  '&:focus-visible': {
    boxShadow: `0 0 0 3px ${tokens.blue200}`,
    outline: 'none',
  },
});

export const modeToggleButtonActive = css({
  backgroundColor: tokens.colorWhite,
  boxShadow: '0 1px 2px rgba(17, 27, 43, 0.12)',
  color: tokens.gray900,
  cursor: 'default',

  '&:hover': {
    backgroundColor: tokens.colorWhite,
    color: tokens.gray900,
  },
});

export const cancelReviewButton = css({
  '&, &&': {
    backgroundColor: tokens.colorWhite,
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: 'none',
    color: tokens.gray900,
    fontWeight: tokens.fontWeightDemiBold,
  },

  '&:hover, &&:hover': {
    backgroundColor: tokens.gray100,
    borderColor: tokens.gray400,
    color: tokens.gray900,
  },

  '&:focus-visible, &&:focus-visible': {
    boxShadow: `0 0 0 3px ${tokens.blue200}`,
    outline: 'none',
  },
});
