import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

export const modalContent = css({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacingL,
});

export const sectionCard = css({
  border: `1px solid ${tokens.gray200}`,
  borderRadius: tokens.borderRadiusSmall,
  padding: tokens.spacingS,
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacingXs,
});

export const locationsContainer = css({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  border: `1px solid ${tokens.gray200}`,
  borderRadius: tokens.borderRadiusSmall,
  overflow: 'hidden',
});

export const locationColumnLeft = css({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacingS,
  padding: tokens.spacingS,
  borderRight: `1px solid ${tokens.gray200}`,
});

export const locationColumnRight = css({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacingS,
  padding: tokens.spacingS,
});

export const locationColumnHeader = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: '32px',
});

export const newLocationCard = css({
  border: `1px solid ${tokens.gray200}`,
  borderRadius: tokens.borderRadiusSmall,
  padding: tokens.spacingS,
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacingS,
});

export const newLocationScrollableList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacingS,
  maxHeight: '260px',
  overflowY: 'auto',
});

export const selectedContentSection = css({
  gridColumn: '1 / -1',
  borderBottom: `1px solid ${tokens.gray200}`,
  padding: tokens.spacingS,
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacingXs,
});
