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

// `&&` outranks the f36 Button rule that sets the same background/color.
export const modeToggleButton = css({
  '&&': {
    alignItems: 'center',
    background: 'none',
    border: 'none',
    borderRadius: `calc(${tokens.borderRadiusMedium} - 2px)`,
    boxShadow: 'none',
    color: tokens.gray600,
    cursor: 'pointer',
    display: 'inline-flex',
    fontSize: tokens.fontSizeS,
    fontWeight: tokens.fontWeightDemiBold,
    gap: tokens.spacingXs,
    lineHeight: tokens.lineHeightDefault,
    minHeight: '28px',
    padding: `0 ${tokens.spacingS}`,
    transition: 'background 100ms ease, box-shadow 100ms ease, color 100ms ease',
    whiteSpace: 'nowrap',

    '& svg': {
      flexShrink: 0,
    },

    '&:hover': {
      background: tokens.gray200,
      color: tokens.gray900,
    },

    '&:focus-visible': {
      boxShadow: `0 0 0 3px ${tokens.blue200}`,
      outline: 'none',
    },
  },
});

export const modeToggleButtonActive = css({
  '&&': {
    background: tokens.colorWhite,
    boxShadow: '0 1px 2px rgba(17, 27, 43, 0.12)',
    color: tokens.gray900,
    cursor: 'default',

    '&:hover': {
      background: tokens.colorWhite,
      color: tokens.gray900,
    },
  },
});
