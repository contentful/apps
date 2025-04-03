import { CSSProperties } from 'react';
import tokens from '@contentful/f36-tokens';

export const lStyle: CSSProperties = {
  borderBottom: `1px solid ${tokens.gray300}`,
  borderLeft: `1px solid ${tokens.gray300}`,
  width: tokens.spacingL,
  height: '25px',
  marginBottom: '16px',
};

export const tTopStyle: CSSProperties = {
  borderBottom: `1px solid ${tokens.gray300}`,
  borderLeft: `1px solid ${tokens.gray300}`,
  width: tokens.spacingL,
  height: '28px',
};

export const tBottomStyle: CSSProperties = {
  borderLeft: `1px solid ${tokens.gray300}`,
  width: tokens.spacingL,
  height: '20px',
};
