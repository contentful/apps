import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

export const selectAllCheckboxBaseStyles = css({
  borderRadius: tokens.borderRadiusSmall,
  paddingLeft: tokens.spacingXs,
  paddingRight: tokens.spacing2Xs,
  paddingBottom: tokens.spacing2Xs,
  paddingTop: tokens.spacing2Xs,
});

export const selectAllCheckboxSelectedStyles = css({
  backgroundColor: tokens.gray200,
  '&:hover': {
    backgroundColor: tokens.gray200,
  },
});

export const selectAllCheckboxUnselectedStyles = css({
  backgroundColor: 'transparent',
  '&:hover': {
    backgroundColor: tokens.gray100,
  },
});

export const selectAllTextStyles = css({
  cursor: 'pointer',
  fontWeight: tokens.fontWeightDemiBold,
});

export const optionStyles = css({
  fontSize: tokens.fontSizeS,
});

export const selectAllCheckboxDisabledStyles = css({
  backgroundColor: tokens.gray100,
});

export const selectAllTextDisabledStyles = css({
  cursor: 'not-allowed',
  color: tokens.gray500,
});
