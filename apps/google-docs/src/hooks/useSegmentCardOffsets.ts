import { useLayoutEffect, useRef, useState, type RefCallback } from 'react';
import { resolveMarkerOffsets } from '../locations/Page/components/review/mapping/resolveMappingCardOffsets';
import type { DocSegment } from '../locations/Page/components/review/mapping/buildDocument';
import type { AnchoredMappingCard } from '../locations/Page/components/review/mapping/MappingEntryCards';

interface UseSegmentCardOffsetsParams {
  allSegments: DocSegment[];
  mappingCardsBySegment: Record<string, AnchoredMappingCard[]>;
}

export function useSegmentCardOffsets({
  allSegments,
  mappingCardsBySegment,
}: UseSegmentCardOffsetsParams) {
  const [cardOffsetsBySegment, setCardOffsetsBySegment] = useState<
    Record<string, Record<string, number>>
  >({});
  const segmentLayoutRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const cardWrapperRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const setSegmentLayoutRef =
    (segmentId: string): RefCallback<HTMLDivElement> =>
    (node) => {
      segmentLayoutRefs.current[segmentId] = node;
    };

  const setCardWrapperRef =
    (cardKey: string): RefCallback<HTMLDivElement> =>
    (node) => {
      cardWrapperRefs.current[cardKey] = node;
    };

  useLayoutEffect(() => {
    const nextOffsets: Record<string, Record<string, number>> = {};

    allSegments.forEach((segment) => {
      const segmentNode = segmentLayoutRefs.current[segment.id];
      const segmentCards = mappingCardsBySegment[segment.id] ?? [];

      if (!segmentNode || segmentCards.length === 0) {
        return;
      }

      const segmentTop = segmentNode.getBoundingClientRect().top;
      const cards = segmentCards.map((card) => {
        const anchorNode = segmentNode.querySelector<HTMLElement>(`#${CSS.escape(card.anchorId)}`);
        const wrapperNode = cardWrapperRefs.current[card.key];
        const rawTop = anchorNode
          ? Math.max(0, anchorNode.getBoundingClientRect().top - segmentTop)
          : 0;
        const height =
          wrapperNode?.getBoundingClientRect().height || wrapperNode?.offsetHeight || 28;

        return { key: card.key, rawTop, height };
      });

      nextOffsets[segment.id] = resolveMarkerOffsets(cards);
    });

    setCardOffsetsBySegment(nextOffsets);
  }, [allSegments, mappingCardsBySegment]);

  return {
    cardOffsetsBySegment,
    setSegmentLayoutRef,
    setCardWrapperRef,
  };
}
