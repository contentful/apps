import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefCallback,
} from 'react';
import {
  Box,
  Card,
  Flex,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Text,
  TextLink,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import type {
  SourceRef,
  MappingReviewSuspendPayload,
  NormalizedDocumentContentBlock,
  NormalizedDocumentFlattenedRun,
  NormalizedDocumentTable,
  NormalizedDocumentTablePart,
  TextSourceRef,
} from '@types';
import { isBlockImageSourceRef, isTableImageSourceRef, isTextSourceRef } from '@types';
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

type AnchoredMappingCard = MappingCardData & {
  anchorId: string;
};

type TextSegment = {
  text: string;
  styles?: NormalizedDocumentFlattenedRun['styles'];
  highlighted: boolean;
  mappingKeys: string[];
};

function buildTextSegments(
  flattenedRuns: NormalizedDocumentFlattenedRun[],
  usage: Array<{ sourceRef: SourceRef; mappingKey: string }>
): TextSegment[] {
  if (!flattenedRuns.length) return [];

  const textUsage = usage.filter(
    (usageItem): usageItem is { sourceRef: TextSourceRef; mappingKey: string } =>
      isTextSourceRef(usageItem.sourceRef)
  );

  const boundaries = new Set<number>();
  flattenedRuns.forEach((run) => {
    boundaries.add(run.start);
    boundaries.add(run.end);
  });
  textUsage.forEach(({ sourceRef }) => {
    boundaries.add(sourceRef.start);
    boundaries.add(sourceRef.end);
  });

  const sortedBoundaries = [...boundaries].sort((a, b) => a - b);

  return sortedBoundaries.flatMap((start, index) => {
    const end = sortedBoundaries[index + 1];
    if (end === undefined || start === end) {
      return [];
    }

    const run = flattenedRuns.find((candidate) => start >= candidate.start && end <= candidate.end);
    if (!run) {
      return [];
    }

    const text = run.text.slice(start - run.start, end - run.start);
    if (!text) {
      return [];
    }

    const mappingKeys = textUsage
      .filter(({ sourceRef }) => start >= sourceRef.start && end <= sourceRef.end)
      .map(({ mappingKey }) => mappingKey);

    return [
      {
        text,
        styles: run?.styles,
        highlighted: mappingKeys.length > 0,
        mappingKeys,
      },
    ];
  });
}

function getTextSegmentStyle(styles?: NormalizedDocumentFlattenedRun['styles']): CSSProperties {
  return {
    fontWeight: styles?.bold ? 600 : undefined,
    fontStyle: styles?.italic ? 'italic' : undefined,
    textDecoration: styles?.underline
      ? 'underline'
      : styles?.strikethrough
      ? 'line-through'
      : undefined,
    verticalAlign: styles?.superscript ? 'super' : styles?.subscript ? 'sub' : undefined,
  };
}

function renderTextSegment(
  key: string,
  segment: TextSegment,
  hovered: boolean,
  setHoveredMappings: (mappingKeys: string[]) => void
) {
  const content = (
    <Box
      as="span"
      key={key}
      onMouseEnter={segment.highlighted ? () => setHoveredMappings(segment.mappingKeys) : undefined}
      onMouseLeave={segment.highlighted ? () => setHoveredMappings([]) : undefined}
      style={{
        ...getTextSegmentStyle(segment.styles),
        backgroundColor: segment.highlighted
          ? hovered
            ? tokens.green300
            : tokens.green200
          : 'transparent',
        borderRadius: segment.highlighted ? tokens.borderRadiusSmall : undefined,
        whiteSpace: 'pre-wrap',
        transition: 'background-color 120ms ease',
      }}>
      {segment.text}
    </Box>
  );

  const linkUrl = segment.styles?.linkUrl?.trim();
  if (!linkUrl) {
    return content;
  }

  return (
    <TextLink key={`link-${key}`} href={linkUrl} target="_blank" rel="noreferrer">
      {content}
    </TextLink>
  );
}

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

  const listMarkers = useMemo(
    () =>
      buildListMarkers(
        allSegments
          .filter((seg): seg is Extract<DocSegment, { kind: 'block' }> => seg.kind === 'block')
          .map((seg) => seg.block)
      ),
    [allSegments]
  );

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

  const isMappingHovered = (mappingKeys: string[]) =>
    mappingKeys.some((mappingKey) => hoveredMappingKeys.includes(mappingKey));

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
    window.addEventListener('resize', measureOffsets);

    return () => {
      window.removeEventListener('resize', measureOffsets);
    };
  }, [mappingCardsBySegment, allSegments]);

  const renderBlock = (segmentId: string, block: NormalizedDocumentContentBlock) => {
    const visibleHighlights = getVisibleHighlights(highlightIndex.blockHighlights[block.id] ?? []);
    const visibleRefs = visibleHighlights.map((h) => h.sourceRef);
    const textUsage = visibleHighlights.map((h) => ({
      sourceRef: h.sourceRef,
      mappingKey: getMappingCardKey(segmentId, h),
    }));
    const textSegments = buildTextSegments(block.flattenedTextRuns, textUsage);
    const listMarker = block.type === 'listItem' ? listMarkers[block.id] : null;
    const setHoveredMappings = (mappingKeys: string[]) => setHoveredMappingKeys(mappingKeys);

    const renderedText = (
      <Text as="p" marginBottom="none">
        {textSegments.map((seg, index) => {
          const hovered = isMappingHovered(seg.mappingKeys);
          return renderTextSegment(`${block.id}-${index}`, seg, hovered, setHoveredMappings);
        })}
      </Text>
    );

    return (
      <Box>
        {listMarker ? (
          <Flex
            data-testid={`list-item-${block.id}`}
            alignItems="flex-start"
            gap="spacing2Xs"
            style={{
              marginInlineStart:
                listMarker.nestingLevel > 0
                  ? `calc(${tokens.spacingM} * ${listMarker.nestingLevel})`
                  : undefined,
            }}>
            <Text
              as="span"
              data-testid={`list-marker-${block.id}`}
              fontColor="gray600"
              style={{
                minWidth: tokens.spacingM,
                lineHeight: tokens.lineHeightM,
                flex: '0 0 auto',
              }}>
              {listMarker.marker}
            </Text>
            <Box style={{ minWidth: 0, flex: 1 }}>{renderedText}</Box>
          </Flex>
        ) : (
          renderedText
        )}

        {block.imageIds.map((imageId: string) => {
          const image = imageById[imageId];
          if (!image) return null;
          const highlighted = visibleRefs.some(
            (ref) => isBlockImageSourceRef(ref) && ref.imageId === imageId
          );
          const mappingKeys = visibleHighlights
            .filter((h) => isBlockImageSourceRef(h.sourceRef) && h.sourceRef.imageId === imageId)
            .map((h) => getMappingCardKey(segmentId, h));
          const hovered = isMappingHovered(mappingKeys);

          return (
            <Box key={image.id} marginTop="spacingS">
              <Box
                as="img"
                src={image.url}
                alt={image.altText ?? image.title ?? 'Document image'}
                data-highlighted={highlighted ? 'true' : 'false'}
                data-hovered={hovered ? 'true' : 'false'}
                onMouseEnter={highlighted ? () => setHoveredMappings(mappingKeys) : undefined}
                onMouseLeave={highlighted ? () => setHoveredMappings([]) : undefined}
                style={{
                  width: '100%',
                  maxHeight: 280,
                  objectFit: 'contain',
                  borderRadius: tokens.borderRadiusMedium,
                  border: `2px solid ${
                    highlighted ? (hovered ? tokens.green600 : tokens.green500) : tokens.gray300
                  }`,
                  backgroundColor: tokens.gray100,
                  transition: 'border-color 120ms ease',
                }}
              />
            </Box>
          );
        })}
      </Box>
    );
  };

  const renderTablePart = (
    segmentId: string,
    table: NormalizedDocumentTable,
    rowId: string,
    cellId: string,
    part: NormalizedDocumentTablePart
  ) => {
    const partKey = [table.id, rowId, cellId, part.id].join(':');
    const visibleHighlights = getVisibleHighlights(
      highlightIndex.tablePartHighlights[partKey] ?? []
    );
    const visibleRefs = visibleHighlights.map((h) => h.sourceRef);
    const setHoveredMappings = (mappingKeys: string[]) => setHoveredMappingKeys(mappingKeys);

    if (part.type === 'image') {
      const image = imageById[part.imageId];
      const highlighted = visibleRefs.some((ref) => isTableImageSourceRef(ref));
      const mappingKeys = visibleHighlights
        .filter((h) => isTableImageSourceRef(h.sourceRef))
        .map((h) => getMappingCardKey(segmentId, h));
      const hovered = isMappingHovered(mappingKeys);

      if (!image) {
        return null;
      }

      return (
        <Box marginTop="spacing2Xs">
          <Box
            as="img"
            src={image.url}
            alt={image.altText ?? image.title ?? 'Table image'}
            data-testid={`table-image-part-${part.id}`}
            onMouseEnter={highlighted ? () => setHoveredMappings(mappingKeys) : undefined}
            onMouseLeave={highlighted ? () => setHoveredMappings([]) : undefined}
            style={{
              width: '100%',
              maxWidth: 180,
              objectFit: 'contain',
              borderRadius: tokens.borderRadiusMedium,
              border: `2px solid ${
                highlighted ? (hovered ? tokens.green600 : tokens.green500) : tokens.gray300
              }`,
              backgroundColor: tokens.gray100,
              transition: 'border-color 120ms ease',
            }}
          />
        </Box>
      );
    }

    const textUsage = visibleHighlights.map((h) => ({
      sourceRef: h.sourceRef,
      mappingKey: getMappingCardKey(segmentId, h),
    }));
    const textSegments = buildTextSegments(part.flattenedTextRuns, textUsage);

    return (
      <Box as="span" style={{ whiteSpace: 'pre-wrap' }}>
        {textSegments.map((seg, index) => {
          const hovered = isMappingHovered(seg.mappingKeys);
          return renderTextSegment(`${part.id}-${index}`, seg, hovered, setHoveredMappings);
        })}
      </Box>
    );
  };

  const renderTable = (segmentId: string, table: NormalizedDocumentTable) => (
    <Table>
      {table.headers.length > 0 && (
        <TableHead>
          <TableRow>
            {table.headers.map((header: string, headerIndex: number) => (
              <TableCell key={`${table.id}-header-${headerIndex}`}>{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
      )}
      <TableBody>
        {table.rows.map((row) => (
          <TableRow
            key={row.id}
            data-anchor-id={`row:${table.id}:${row.id}`}
            data-testid={`table-row-${row.id}`}>
            {row.cells.map((cell) => (
              <TableCell
                key={cell.id}
                data-testid={`table-cell-${cell.id}`}
                style={{ backgroundColor: 'transparent', verticalAlign: 'top' }}>
                <Flex flexDirection="column" gap="spacing2Xs">
                  {cell.parts.map((part) => (
                    <Box key={part.id}>
                      {renderTablePart(segmentId, table, row.id, cell.id, part)}
                    </Box>
                  ))}
                </Flex>
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

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
                              borderRadius: tokens.borderRadiusMedium,
                              padding: tokens.spacingS,
                              backgroundColor: 'transparent',
                            }}>
                            {segment.kind === 'table'
                              ? renderTable(segment.id, segment.table)
                              : renderBlock(segment.id, segment.block)}
                          </Box>
                        </Box>
                      </Box>

                      <Box
                        data-testid={`mapping-rail-${segment.id}`}
                        style={{ flex: '0 0 280px', maxWidth: 280, position: 'relative' }}>
                        <Box style={{ position: 'relative', minHeight: '100%' }}>
                          {mappingCards.length > 0
                            ? mappingCards.map((mappingCard) => (
                                <Box
                                  key={mappingCard.key}
                                  data-testid={`mapping-card-position-${mappingCard.key}`}
                                  ref={setCardWrapperRef(mappingCard.key)}
                                  style={{
                                    position: 'absolute',
                                    insetInlineStart: 0,
                                    insetInlineEnd: 0,
                                    top: cardOffsetsBySegment[segment.id]?.[mappingCard.key] ?? 0,
                                  }}>
                                  <MappingCard
                                    card={mappingCard}
                                    isHovered={hoveredMappingKeys.includes(mappingCard.key)}
                                    onMouseEnter={() => setHoveredMappingKeys([mappingCard.key])}
                                    onMouseLeave={() => setHoveredMappingKeys([])}
                                  />
                                </Box>
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
