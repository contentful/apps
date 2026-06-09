import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

export const modalContent = css({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacingL,
});

export const contentSection = css({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacingXs,
});

export const sectionCard = css({
  border: `1px solid ${tokens.gray200}`,
  borderRadius: tokens.borderRadiusSmall,
  padding: tokens.spacingS,
});

export const locationsRow = css({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: tokens.spacingL,
  alignItems: 'start',
});

export const locationColumn = css({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacingS,
});

export const locationColumnHeader = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const currentLocationCard = css({
  border: `1px solid ${tokens.gray200}`,
  borderRadius: tokens.borderRadiusSmall,
  padding: tokens.spacingS,
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacingXs,
});

export const newLocationCard = css({
  border: `1px solid ${tokens.gray200}`,
  borderRadius: tokens.borderRadiusSmall,
  padding: tokens.spacingS,
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacingS,
});

export const searchInput = css({
  width: '100%',
  border: `1px solid ${tokens.gray300}`,
  borderRadius: tokens.borderRadiusSmall,
  padding: `${tokens.spacingXs} ${tokens.spacingS}`,
  fontSize: tokens.fontSizeM,
  outline: 'none',
  '&:focus': {
    borderColor: tokens.blue500,
  },
});
