import type { CSSProperties } from 'react';
import tokens from '@contentful/f36-tokens';

export const containerStyles: CSSProperties = {
  position: 'relative',
  width: '100%',
};

export const triggerStyles: CSSProperties = {
  width: '100%',
  minHeight: '44px',
  padding: '9px 14px',
  border: `1px solid ${tokens.colorElementMid}`,
  borderRadius: tokens.borderRadiusMedium,
  backgroundColor: tokens.colorWhite,
  color: tokens.colorTextDark,
  cursor: 'pointer',
  textAlign: 'left',
  position: 'relative',
  zIndex: 3,
};

export const triggerTextStyles: CSSProperties = {
  fontSize: tokens.fontSizeM,
  lineHeight: tokens.lineHeightM,
  fontWeight: 400,
};

export const dropdownStyles: CSSProperties = {
  position: 'absolute',
  top: '40px',
  left: 0,
  right: 0,
  zIndex: 2,
  border: `1px solid ${tokens.colorElementMid}`,
  borderRadius: tokens.borderRadiusMedium,
  backgroundColor: tokens.colorWhite,
  boxShadow: tokens.boxShadowDefault.replace(/;$/, ''),
  padding: '4px 0',
  maxHeight: '280px',
  overflowY: 'auto',
};

export const searchContainerStyles: CSSProperties = {
  padding: `0 ${tokens.spacingM} 4px`,
};

export const searchRowStyles: CSSProperties = {
  position: 'relative',
  margin: `-4px -${tokens.spacingM} 0`,
  padding: `${tokens.spacingM} ${tokens.spacingL}`,
  borderBottom: `1px solid ${tokens.colorElementLightest}`,
};

export const searchInputStyles: CSSProperties = {
  width: '100%',
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  color: tokens.colorTextMid,
  fontSize: tokens.fontSizeM,
  lineHeight: tokens.lineHeightM,
  fontWeight: 400,
  paddingRight: '36px',
  fontFamily: 'inherit',
  height: '20px',
};

export const searchIconWrapperStyles: CSSProperties = {
  position: 'absolute',
  top: '50%',
  right: tokens.spacingL,
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
};

export const checkboxRowStyles: CSSProperties = {
  padding: `${tokens.spacingS} ${tokens.spacingL}`,
};

export const regularWeightTextStyles: CSSProperties = {
  fontWeight: 400,
};

export const emptyStateStyles: CSSProperties = {
  padding: tokens.spacingM,
};
