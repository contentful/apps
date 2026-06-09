import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

// Grid wrapper with outer border — can't be expressed via f36 component props
export const locationsContainer = css({
  display: 'grid',
  gridTemplateColumns: '217px 1fr',
  border: `1px solid ${tokens.gray200}`,
  borderRadius: tokens.borderRadiusSmall,
  overflow: 'hidden',
});

// Full-width top row in the grid — gridColumn can't be set via f36 props
export const selectedContentSection = css({
  gridColumn: '1 / -1',
  borderBottom: `1px solid ${tokens.gray200}`,
});

// Shared appearance for all grey-background boxes — layout via Flex/Box props in JSX
export const greyCard = css({
  backgroundColor: tokens.gray100,
  border: `1px solid ${tokens.gray200}`,
  borderRadius: tokens.borderRadiusSmall,
});

// Left column divider only — everything else via Flex props in JSX
export const locationColumnLeft = css({
  borderRight: `1px solid ${tokens.gray200}`,
});

// Overflow cap — can't be set via f36 component props
export const newLocationScrollableList = css({
  maxHeight: '260px',
  overflowY: 'auto',
});
