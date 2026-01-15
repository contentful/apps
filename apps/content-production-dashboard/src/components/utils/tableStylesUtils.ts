import { CSSProperties } from 'react';

export const cellWithWidth = (width: string): CSSProperties => ({
  verticalAlign: 'middle',
  width,
  minWidth: '50px',
});

