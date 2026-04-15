import { Box, type BoxProps } from '@contentful/f36-components';
import { type RefCallback } from 'react';
import { MappingCard, type MappingCardData } from './MappingCard';

export type AnchoredMappingCard = MappingCardData & {
  anchorId: string;
};

interface MappingEntryCardsProps {
  segmentId: string;
  mappingCards: AnchoredMappingCard[];
  cardOffsetsBySegment: Record<string, Record<string, number>>;
  hoveredMappingKeys: string[];
  onSetHoveredMappingKeys: (keys: string[]) => void;
  setCardWrapperRef: (cardKey: string) => RefCallback<HTMLDivElement>;
}

const railStyles: BoxProps['style'] = {
  flex: '0 0 280px',
  maxWidth: 280,
  position: 'relative',
};

export const MappingEntryCards = ({
  segmentId,
  mappingCards,
  cardOffsetsBySegment,
  hoveredMappingKeys,
  onSetHoveredMappingKeys,
  setCardWrapperRef,
}: MappingEntryCardsProps): JSX.Element => {
  return (
    <Box data-testid={`mapping-rail-${segmentId}`} style={railStyles}>
      <Box style={{ position: 'relative', minHeight: '100%' }}>
        {mappingCards.length > 0
          ? mappingCards.map((mappingCard) => (
              <MappingCard
                key={mappingCard.key}
                card={mappingCard}
                top={cardOffsetsBySegment[segmentId]?.[mappingCard.key] ?? 0}
                wrapperRef={setCardWrapperRef(mappingCard.key)}
                isHovered={hoveredMappingKeys.includes(mappingCard.key)}
                onMouseEnter={() => onSetHoveredMappingKeys([mappingCard.key])}
                onMouseLeave={() => onSetHoveredMappingKeys([])}
              />
            ))
          : null}
      </Box>
    </Box>
  );
};
