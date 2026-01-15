import tokens from '@contentful/f36-tokens';
import { CSSProperties } from 'react';

export const styles = {
  legendDot: {
    width: tokens.spacingM,
    height: tokens.spacingM,
    marginRight: tokens.spacing2Xs,
    borderRadius: '50%',
    flexShrink: 0,
  } as CSSProperties,
  chartContainer: {
    flex: 1,
  } as CSSProperties,
  legendContainer: {
    width: '20%',
  } as CSSProperties,
};
