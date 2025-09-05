import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

export const selectAllCheckboxStyles = (areAllSelected: boolean) =>
  css({
    backgroundColor: areAllSelected ? tokens.gray200 : 'transparent',
    borderRadius: tokens.borderRadiusSmall,
    paddingLeft: tokens.spacingXs,
    paddingRight: tokens.spacing2Xs,
    paddingBottom: tokens.spacing2Xs,
    paddingTop: tokens.spacing2Xs,
    '&:hover': {
      backgroundColor: areAllSelected ? tokens.gray200 : tokens.gray100,
    },
  });

export const selectAllTextStyles = css({
  cursor: 'pointer',
  fontWeight: tokens.fontWeightDemiBold,
});

export const optionStyles = css({
  fontSize: tokens.fontSizeS,
});
