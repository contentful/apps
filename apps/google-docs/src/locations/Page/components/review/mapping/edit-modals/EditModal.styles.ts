import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

export const modalContent = css({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacingL,
});

export const modalContentWithDropdown = css({
  minHeight: '500px',
});

export const sectionCard = css({
  border: `1px solid ${tokens.gray200}`,
  borderRadius: tokens.borderRadiusSmall,
  padding: tokens.spacingS,
});

export const locationList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacingS,
});

export const locationButton = css({
  appearance: 'none',
  width: '100%',
  borderRadius: tokens.borderRadiusSmall,
  padding: tokens.spacingXs,
  backgroundColor: tokens.gray100,
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'border-color 120ms ease, background-color 120ms ease',
  ':focus-visible': {
    outline: `2px solid ${tokens.blue500}`,
    outlineOffset: '2px',
  },
});

export const locationButtonSelected = css({
  border: `2px solid ${tokens.blue500}`,
});

export const locationButtonUnselected = css({
  border: `1px solid ${tokens.gray200}`,
});

export const locationContent = css({
  minWidth: 0,
});
