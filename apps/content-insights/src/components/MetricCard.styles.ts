import tokens from '@contentful/f36-tokens';
import { CSSProperties } from 'react';

export const styles = {
  card: {
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.spacing2Xs,
    boxShadow: 'none',
    backgroundColor: tokens.colorWhite,
  } as CSSProperties,
};
