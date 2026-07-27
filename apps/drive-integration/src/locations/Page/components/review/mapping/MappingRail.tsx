import { Box } from '@contentful/f36-components';
import { type ReactNode } from 'react';
import { mappingRailStyle } from './MappingView.styles';

const FALLBACK_CARD_HEIGHT = 28;

export function getMappingRailMinHeight(
  cards: Array<{ key: string }>,
  offsets: Record<string, number>,
  heights: Record<string, number>
): number {
  if (cards.length === 0) {
    return 0;
  }

  return Math.max(
    0,
    ...cards.map((card) => (offsets[card.key] ?? 0) + (heights[card.key] ?? FALLBACK_CARD_HEIGHT))
  );
}

interface MappingRailProps {
  testId: string;
  minHeight: number;
  children: ReactNode;
}

export const MappingRail = ({ testId, minHeight, children }: MappingRailProps): JSX.Element => (
  <Box data-testid={testId} style={mappingRailStyle}>
    <Box style={{ position: 'relative', minHeight }}>{children}</Box>
  </Box>
);
