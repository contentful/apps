import tokens from '@contentful/f36-tokens';
import { CSSProperties } from 'react';

export const styles = {
  releasesTableContainer: {
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusMedium,
  } as CSSProperties,
  container: {
    padding: tokens.spacingL,
    backgroundColor: tokens.colorWhite,
  } as CSSProperties,
  flexGrow: {
    flex: 1,
  } as CSSProperties,
  sectionContainer: {
    border: `1px solid ${tokens.gray300}`,
    borderRadius: '4px',
    padding: tokens.spacingL,
    backgroundColor: tokens.colorWhite,
  } as CSSProperties,
};
