import tokens from '@contentful/f36-tokens';
import { CSSProperties } from 'react';

export const styles = {
  emptyStateContainer: {
    flexDirection: 'column',
    padding: tokens.spacingL,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.gray100,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.gray200}`,
    height: '300px',
    marginRight: tokens.spacingS,
    marginLeft: tokens.spacingS,
    marginBottom: tokens.spacingL,
  } as CSSProperties,
  formControlPadding: {
    padding: tokens.spacingS,
  } as CSSProperties,
  creatorControlWidth: {
    minWidth: '280px',
    maxWidth: '360px',
    flex: '1 1 0',
  } as CSSProperties,
};
