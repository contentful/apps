import { Box, type BoxProps } from '@contentful/f36-components';
import { type RefCallback } from 'react';
import { MappingCard } from './MappingCard';
import type { RenderedMappingCard } from './buildMappingDisplayGroups';

interface MappingEntryCardsProps {
  groupId: string;
  mappingCards: RenderedMappingCard[];
  cardOffsetsByGroup: Record<string, Record<string, number>>;
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
  groupId,
  mappingCards,
  cardOffsetsByGroup,
  hoveredMappingKeys,
  onSetHoveredMappingKeys,
  setCardWrapperRef,
}: MappingEntryCardsProps): JSX.Element => {
  return (
    <Box data-testid={`mapping-rail-${groupId}`} style={railStyles}>
      <Box style={{ position: 'relative', minHeight: '100%' }}>
        {mappingCards.length > 0
          ? mappingCards.map((mappingCard) => (
              <MappingCard
                key={mappingCard.key}
                card={mappingCard}
                top={cardOffsetsByGroup[groupId]?.[mappingCard.key] ?? 0}
                wrapperRef={setCardWrapperRef(mappingCard.key)}
                isHovered={mappingCard.mappingKeys.some((key) => hoveredMappingKeys.includes(key))}
                onMouseEnter={() => onSetHoveredMappingKeys(mappingCard.mappingKeys)}
                onMouseLeave={() => onSetHoveredMappingKeys([])}
              />
            ))
          : null}
      </Box>
    </Box>
  );
};
