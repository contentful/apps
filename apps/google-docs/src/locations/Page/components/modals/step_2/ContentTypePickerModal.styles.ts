import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

export const multiselect = css({
  maxWidth: '74%',
});

export const pillsContainer = css({
  marginRight: tokens.spacingXl,
  maxHeight: '100px',
  overflowY: 'scroll',
  '&::-webkit-scrollbar': {
    width: tokens.spacingXs,
    height: tokens.spacingXs,
  },
  '&::-webkit-scrollbar-thumb': {
    background: tokens.gray400,
    borderRadius: tokens.borderRadiusSmall,
  },
});
