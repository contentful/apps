import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

export const formWrapper = css({
  height: '135px',
});

export const multiselect = css({
  maxWidth: '70%',
});

export const multiselectOption = css({
  padding: tokens.spacing2Xs,
});

export const pillsContainer = css({
  marginRight: tokens.spacingXl,
  maxHeight: '120px',
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

export const modalControls = css({
  paddingTop: '0',
});
