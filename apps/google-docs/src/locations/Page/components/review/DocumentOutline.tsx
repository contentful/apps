import { useLayoutEffect, useMemo, useRef, useState, type RefCallback } from 'react';
import { Box, Card, Flex, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import type { MappingReviewSuspendPayload } from '@types';
import { FileTextIcon } from '@contentful/f36-icons';
import { MappingCard, type MappingCardData } from './MappingCard';
import { getAnchorIdForSourceRef, resolveMarkerOffsets } from './utils/mappingCardPositioning';
import { type DocSegment, buildDocument } from './utils/buildDocument';
import {
  buildMappingHighlightIndex,
  getMappingCardKey,
  type MappingHighlight,
  uniqueHighlights,
} from './utils/buildHighlights';
import {
  buildListMarkers,
  buildOverviewEntries,
  formatDisplayName,
  getFieldTypeLabel,
} from './utils/documentOutlineUtils';
import { BlockRenderer, TableRenderer } from './utils/renderDocument';

type AnchoredMappingCard = MappingCardData & {
  anchorId: string;
};

interface DocumentOutlineProps {
  payload: MappingReviewSuspendPayload;
}

export const DocumentOutline = ({ payload }: DocumentOutlineProps): JSX.Element => {
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number | null>(null);
  const [hoveredMappingKeys, setHoveredMappingKeys] = useState<string[]>([]);
  const [cardOffsetsBySegment, setCardOffsetsBySegment] = useState<
    Record<string, Record<string, number>>
  >({});
  const segmentLayoutRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const cardWrapperRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const document = payload.normalizedDocument;

  const highlightIndex = useMemo(
    () => buildMappingHighlightIndex(payload.entryBlockGraph),
    [payload.entryBlockGraph]
  );

  const { tabs, allSegments } = useMemo(() => buildDocument(document), [document]);

  const imageById = useMemo(() => {
    const images = document.images ?? [];
    return images.reduce<Record<string, (typeof images)[number]>>((acc, image) => {
      acc[image.id] = image;
      return acc;
    }, {});
  }, [document.images]);

  const listMarkers = useMemo(() => buildListMarkers(allSegments), [allSegments]);

  const overviewEntries = useMemo(
    () => buildOverviewEntries(payload.entryBlockGraph.entries, payload.contentTypes),
    [payload.contentTypes, payload.entryBlockGraph.entries]
  );

  const getVisibleHighlights = <T extends MappingHighlight>(highlights: T[]): T[] => {
    if (selectedEntryIndex === null) {
      return highlights;
    }
    return highlights.filter((item) => item.entryIndex === selectedEntryIndex);
  };

  const getHighlightsForSegment = (segment: DocSegment): MappingHighlight[] => {
    if (segment.kind === 'table') {
      return uniqueHighlights(highlightIndex.tableHighlights[segment.id] ?? []);
    }
    return uniqueHighlights(highlightIndex.blockHighlights[segment.id] ?? []);
  };

  const getMappingCardsForSegment = (segment: DocSegment): AnchoredMappingCard[] =>
    getVisibleHighlights(getHighlightsForSegment(segment)).map((highlight) => ({
      key: getMappingCardKey(segment.id, highlight),
      fieldName: formatDisplayName(highlight.fieldId),
      fieldType: getFieldTypeLabel(highlight.fieldType),
      anchorId: getAnchorIdForSourceRef(highlight.sourceRef),
    }));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mappingCardsBySegment = useMemo(
    () =>
      allSegments.reduce<Record<string, AnchoredMappingCard[]>>((acc, segment) => {
        acc[segment.id] = getMappingCardsForSegment(segment);
        return acc;
      }, {}),
    [allSegments, selectedEntryIndex, highlightIndex]
  );

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
    const measureOffsets = () => {
      const nextOffsets: Record<string, Record<string, number>> = {};

      allSegments.forEach((segment) => {
        const segmentNode = segmentLayoutRefs.current[segment.id];
        const segmentCards = mappingCardsBySegment[segment.id] ?? [];

        if (!segmentNode || segmentCards.length === 0) {
          return;
        }

        const segmentTop = segmentNode.getBoundingClientRect().top;
        const anchorNodes = Array.from(
          segmentNode.querySelectorAll<HTMLElement>('[data-anchor-id]')
        );

        const cards = segmentCards.map((card) => {
          const anchorNode = anchorNodes.find(
            (node) => node.getAttribute('data-anchor-id') === card.anchorId
          );
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
    };

    measureOffsets();
  }, [mappingCardsBySegment, allSegments]);

  return (
    <Flex flexDirection="column" gap="spacingM" style={{ padding: tokens.spacingL }}>
      {/* // TODO: update this overview to use the overview section component */}
      <Card padding="default" style={{ border: `1px solid ${tokens.gray300}` }}>
        <Flex flexDirection="column" gap="spacingS">
          <Box>
            <Text fontWeight="fontWeightDemiBold">Overview</Text>
            <Text as="p" fontColor="gray600" marginBottom="none">
              Select an entry card to focus the document outline on that entry&apos;s mappings.
            </Text>
          </Box>

          <Flex gap="spacingS" flexWrap="wrap">
            <Box
              as="button"
              type="button"
              data-testid="entry-overview-card-all"
              aria-pressed={selectedEntryIndex === null}
              onClick={() => setSelectedEntryIndex(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: tokens.spacing2Xs,
                minWidth: 220,
                padding: tokens.spacingM,
                borderRadius: tokens.borderRadiusMedium,
                border: `1px solid ${
                  selectedEntryIndex === null ? tokens.green500 : tokens.gray300
                }`,
                backgroundColor: selectedEntryIndex === null ? tokens.green100 : tokens.colorWhite,
                textAlign: 'left',
                cursor: 'pointer',
              }}>
              <Text fontWeight="fontWeightDemiBold">All mappings</Text>
              <Text as="span" fontColor="gray600">
                Show every mapped entry in the document outline.
              </Text>
            </Box>

            {overviewEntries.map((entry) => {
              const isSelected = selectedEntryIndex === entry.entryIndex;
              return (
                <Box
                  as="button"
                  key={entry.key}
                  type="button"
                  data-testid={`entry-overview-card-${entry.key}`}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedEntryIndex(entry.entryIndex)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: tokens.spacing2Xs,
                    minWidth: 220,
                    padding: tokens.spacingM,
                    borderRadius: tokens.borderRadiusMedium,
                    border: `1px solid ${isSelected ? tokens.green500 : tokens.gray300}`,
                    backgroundColor: isSelected ? tokens.green100 : tokens.colorWhite,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}>
                  <Text fontWeight="fontWeightDemiBold">{entry.title}</Text>
                </Box>
              );
            })}
          </Flex>
        </Flex>
      </Card>
      <Flex
        flexDirection="column"
        gap="spacingS"
        style={{ padding: tokens.spacingM, marginTop: tokens.spacingM }}>
        {tabs.map((tab) => (
          <Box key={tab.id}>
            {tab.name && (
              <Flex alignItems="center" gap="spacingXs">
                <FileTextIcon />
                <Text fontWeight="fontWeightDemiBold">{tab.name}</Text>
              </Flex>
            )}

            <Flex flexDirection="column" gap="spacingS">
              {tab.segments.map((segment) => {
                const mappingCards = mappingCardsBySegment[segment.id] ?? [];

                return (
                  <Box key={segment.id}>
                    <Flex
                      gap="spacingM"
                      alignItems="stretch"
                      data-testid={`segment-layout-${segment.id}`}
                      ref={setSegmentLayoutRef(segment.id)}>
                      <Box style={{ flex: 2 }}>
                        <Box data-testid={`segment-surface-${segment.id}`}>
                          <Box
                            data-anchor-id={
                              segment.kind === 'block' ? `block:${segment.block.id}` : undefined
                            }
                            data-testid={
                              segment.kind === 'block'
                                ? `block-anchor-${segment.block.id}`
                                : undefined
                            }
                            style={{
                              padding: tokens.spacingXs,
                            }}>
                            {segment.kind === 'table' ? (
                              <TableRenderer
                                segmentId={segment.id}
                                table={segment.table}
                                highlightIndex={highlightIndex}
                                imageById={imageById}
                                selectedEntryIndex={selectedEntryIndex}
                                hoveredMappingKeys={hoveredMappingKeys}
                                onSetHoveredMappingKeys={setHoveredMappingKeys}
                              />
                            ) : (
                              <BlockRenderer
                                segmentId={segment.id}
                                block={segment.block}
                                highlightIndex={highlightIndex}
                                listMarkers={listMarkers}
                                imageById={imageById}
                                selectedEntryIndex={selectedEntryIndex}
                                hoveredMappingKeys={hoveredMappingKeys}
                                onSetHoveredMappingKeys={setHoveredMappingKeys}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>

                      <Box
                        data-testid={`mapping-rail-${segment.id}`}
                        style={{ flex: '0 0 280px', maxWidth: 280, position: 'relative' }}>
                        <Box style={{ position: 'relative', minHeight: '100%' }}>
                          {mappingCards.length > 0
                            ? mappingCards.map((mappingCard) => (
                                <MappingCard
                                  key={mappingCard.key}
                                  card={mappingCard}
                                  top={cardOffsetsBySegment[segment.id]?.[mappingCard.key] ?? 0}
                                  wrapperRef={setCardWrapperRef(mappingCard.key)}
                                  isHovered={hoveredMappingKeys.includes(mappingCard.key)}
                                  onMouseEnter={() => setHoveredMappingKeys([mappingCard.key])}
                                  onMouseLeave={() => setHoveredMappingKeys([])}
                                />
                              ))
                            : null}
                        </Box>
                      </Box>
                    </Flex>
                  </Box>
                );
              })}
            </Flex>
          </Box>
        ))}
      </Flex>
    </Flex>
  );
};
