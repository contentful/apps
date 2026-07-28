import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

export const locationsContainer = css({
  border: `1px solid ${tokens.gray200}`,
  borderRadius: tokens.borderRadiusSmall,
  overflow: 'hidden',
});

export const selectedContentSection = css({
  borderBottom: `1px solid ${tokens.gray200}`,
});

export const greyCard = css({
  backgroundColor: tokens.gray100,
  border: `1px solid ${tokens.gray200}`,
  borderRadius: tokens.borderRadiusSmall,
});

export const locationColumnLeft = css({
  borderRight: `1px solid ${tokens.gray200}`,
});

export const newLocationScrollableList = css({
  maxHeight: '260px',
  overflowY: 'auto',
});
