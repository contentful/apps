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
