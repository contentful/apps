import { Box, Flex } from '@contentful/f36-components';
import type { BoxProps } from '@contentful/f36-components';
import { ViewMappingCard, type ViewMappingCardData } from './ViewMappingCard';

export type ViewMappingCardEntry = ViewMappingCardData;

interface ViewMappingRailProps {
  segmentId: string;
  cards: ViewMappingCardEntry[];
}

const railStyles: BoxProps['style'] = {
  flex: '0 0 280px',
  maxWidth: 280,
};

export const ViewMappingRail = ({ segmentId, cards }: ViewMappingRailProps): JSX.Element => (
  <Box data-testid={`view-mapping-rail-${segmentId}`} style={railStyles}>
    <Flex flexDirection="column" gap="spacing2Xs">
      {cards.map((card) => (
        <ViewMappingCard key={card.key} card={card} />
      ))}
    </Flex>
  </Box>
);
