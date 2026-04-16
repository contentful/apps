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
