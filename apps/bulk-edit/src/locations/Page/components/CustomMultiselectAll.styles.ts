import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const selectAllCheckboxStyles = (areAllSelected: boolean) => css`
  background-color: ${areAllSelected ? tokens.gray200 : 'transparent'};
  border-radius: ${tokens.borderRadiusSmall};
  padding-left: ${tokens.spacingXs};
  padding-right: ${tokens.spacing2Xs};
  padding-bottom: ${tokens.spacing2Xs};
  padding-top: ${tokens.spacing2Xs};
  &:hover {
    background-color: ${areAllSelected ? tokens.gray200 : tokens.gray100};
  }
`;

export const selectAllTextStyles = css`
  cursor: pointer;
`;

export const optionStyles = css`
  font-size: ${tokens.fontSizeS};
`;
