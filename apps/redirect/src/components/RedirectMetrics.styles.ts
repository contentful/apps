import tokens from '@contentful/f36-tokens';
import { CSSProperties } from 'react';

export const redirectMetricsStyles = {
  card: {
    flex: 1,
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: 'none',
    backgroundColor: tokens.colorWhite,
    width: '100%',
    height: '108px',
  } as CSSProperties,
  text: {
    wordBreak: 'break-word',
  } as CSSProperties,
};
