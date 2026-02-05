import tokens from '@contentful/f36-tokens';
import { CSSProperties } from 'react';

export const styles = {
  releasesTableContainer: {
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusMedium,
  } as CSSProperties,
  container: {
    marginLeft: tokens.spacingM,
    marginRight: tokens.spacingM,
    padding: tokens.spacingL,
    backgroundColor: tokens.colorWhite,
    borderRadius: tokens.spacingS,
    boxShadow: `0 6px 16px -2px ${tokens.gray200}, 0 3px 6px -3px ${tokens.gray400}`,
  } as CSSProperties,
  flexGrow: {
    flex: 1,
  } as CSSProperties,
  sectionContainer: {
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.spacing2Xs,
    paddingTop: tokens.spacingL,
    paddingRight: tokens.spacingL,
    paddingLeft: tokens.spacingL,
    backgroundColor: tokens.colorWhite,
  } as CSSProperties,
};
