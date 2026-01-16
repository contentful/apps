import tokens from '@contentful/f36-tokens';
import { CSSProperties } from 'react';

export const CHART_COLORS = [
  '#4A90E2', // Blue
  '#50C878', // Green
  '#FF6B6B', // Red
  '#FFA500', // Orange
  '#9B59B6', // Purple
  '#1ABC9C', // Teal
  '#E74C3C', // Dark Red
  '#3498DB', // Light Blue
  '#F39C12', // Dark Orange
  '#16A085', // Dark Teal
];

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
