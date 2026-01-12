import tokens from '@contentful/f36-tokens';
import { CSSProperties } from 'react';
import { styles as metricCardStyles } from './MetricCard.styles';

export const styles = {
  metricCard: {
    ...metricCardStyles.card,
    height: '120px',
    padding: tokens.spacingXs,
  } as CSSProperties,

  sectionCard: {
    ...metricCardStyles.card,
    height: '215px',
  } as CSSProperties,
};
