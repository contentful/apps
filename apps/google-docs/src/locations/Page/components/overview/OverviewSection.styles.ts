import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

export const overviewSectionBox = css({
  backgroundColor: tokens.gray100,
  border: `1px solid ${tokens.gray300}`,
  borderRadius: tokens.borderRadiusMedium,
});

export const overviewSectionBoxScrollable = css({
  maxHeight: '348px',
  overflow: 'scroll',
});

export const modeToggleWrapper = css({
  display: 'inline-flex',
  backgroundColor: tokens.gray200,
  border: `1px solid ${tokens.gray300}`,
  borderRadius: '9999px',
  padding: '2px',
  gap: '2px',
});

export const modeToggleButton = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: tokens.spacingXs,
  padding: `${tokens.spacing2Xs} ${tokens.spacingS}`,
  borderRadius: '9999px',
  border: 'none',
  cursor: 'pointer',
  fontSize: tokens.fontSizeM,
  fontWeight: tokens.fontWeightNormal,
  color: tokens.gray700,
  backgroundColor: 'transparent',
  transition: 'background-color 100ms ease, box-shadow 100ms ease',
  whiteSpace: 'nowrap',
  '&:hover': {
    backgroundColor: tokens.colorWhite,
  },
});

export const modeToggleButtonActive = css({
  backgroundColor: tokens.colorWhite,
  color: tokens.gray900,
  fontWeight: tokens.fontWeightDemiBold,
  boxShadow: tokens.boxShadowDefault,
  cursor: 'default',
  '&:hover': {
    backgroundColor: tokens.colorWhite,
  },
});
