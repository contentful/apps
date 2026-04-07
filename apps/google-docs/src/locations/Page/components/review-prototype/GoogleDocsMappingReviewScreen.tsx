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
  Button,
  Card,
  Flex,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Text,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import {
  FixtureContentBlock,
  FixtureSourceRef,
  FixtureTable,
  FixtureTablePart,
  FixtureTextRun,
  FixtureUsageItem,
  GoogleDocsReviewFixture,
} from '../../../../fixtures/googleDocsReview';
import { MappingCard, type MappingCardData } from './MappingCard';
import { getAnchorIdForSourceRef, resolveMarkerOffsets } from './mappingCardPositioning';

interface GoogleDocsMappingReviewScreenProps {
  fixture: GoogleDocsReviewFixture;
  onBack?: () => void;
  showChrome?: boolean;
}

type DocSegment =
  | { kind: 'block'; id: string; position: number; block: FixtureContentBlock }
  | { kind: 'table'; id: string; position: number; table: FixtureTable };

interface OutlineSection {
  id: string;
  title: string;
  segments: DocSegment[];
}

type SourceUsage = FixtureUsageItem & {
  fieldType: string;
  sourceRef: FixtureSourceRef;
};

type AnchoredMappingCard = MappingCardData & {
  anchorId: string;
};

type TextSegment = {
  text: string;
  styles?: FixtureTextRun['styles'];
  highlighted: boolean;
};

type ListItemPresentation = {
  marker: string;
  nestingLevel: number;
};

const getBlockText = (block: FixtureContentBlock): string =>
  block.textRuns
    .map((run) => run.text)
    .join('')
    .trim();

const formatDisplayName = (value: string): string => {
  const normalized = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return value;
  }

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
};

const getEntryDisplayTitle = (entry: GoogleDocsReviewFixture['entries'][number]): string => {
  const titleField = entry.fields?.title;
  if (typeof titleField !== 'object' || titleField === null) {
    return formatDisplayName(entry.contentTypeId);
  }

  const localeValue = Object.values(titleField as Record<string, unknown>).find(
    (value) => typeof value === 'string'
  );

  return typeof localeValue === 'string' && localeValue.trim().length > 0
    ? localeValue
    : formatDisplayName(entry.contentTypeId);
};

function buildUsageIndexes(fixture: GoogleDocsReviewFixture): {
  blockUsage: Record<string, SourceUsage[]>;
  tablePartUsage: Record<string, SourceUsage[]>;
  tableUsage: Record<string, SourceUsage[]>;
} {
  const blockUsage: Record<string, SourceUsage[]> = {};
  const tablePartUsage: Record<string, SourceUsage[]> = {};
  const tableUsage: Record<string, SourceUsage[]> = {};

  fixture.entryBlockGraph.entries.forEach((mappingEntry, entryIndex) => {
    mappingEntry.fieldMappings.forEach((fieldMapping) => {
      fieldMapping.sourceRefs.forEach((sourceRef) => {
        const usage: SourceUsage = {
          entryIndex,
          fieldId: fieldMapping.fieldId,
          fieldType: fieldMapping.fieldType,
          sourceRef,
        };

        if (sourceRef.kind === 'blockText' || sourceRef.kind === 'blockImage') {
          blockUsage[sourceRef.blockId] = [...(blockUsage[sourceRef.blockId] ?? []), usage];
          return;
        }

        const tablePartKey = [
          sourceRef.tableId,
          sourceRef.rowId,
          sourceRef.cellId,
          sourceRef.partId,
        ].join(':');
        tablePartUsage[tablePartKey] = [...(tablePartUsage[tablePartKey] ?? []), usage];
        tableUsage[sourceRef.tableId] = [...(tableUsage[sourceRef.tableId] ?? []), usage];
      });
    });
  });

  return { blockUsage, tablePartUsage, tableUsage };
}

function uniqueUsage<T extends SourceUsage>(usage: T[]): T[] {
  const seen = new Set<string>();
  return usage.filter((item) => {
    const key = `${item.entryIndex}-${item.fieldId}-${item.fieldType}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function buildTextSegments(textRuns: FixtureTextRun[], refs: FixtureSourceRef[]): TextSegment[] {
  const textRefs = refs.filter(
    (sourceRef): sourceRef is Extract<FixtureSourceRef, { kind: 'blockText' | 'tableText' }> =>
      sourceRef.kind === 'blockText' || sourceRef.kind === 'tableText'
  );

  let fullText = '';
  const runRanges: Array<{ start: number; end: number; styles?: FixtureTextRun['styles'] }> = [];

  textRuns.forEach((run) => {
    const start = fullText.length;
    fullText += run.text;
    runRanges.push({ start, end: fullText.length, styles: run.styles });
  });

  const boundaries = new Set<number>([0, fullText.length]);
  runRanges.forEach((range) => {
    boundaries.add(range.start);
    boundaries.add(range.end);
  });
  textRefs.forEach((ref) => {
    boundaries.add(ref.start);
    boundaries.add(ref.end);
  });

  const sortedBoundaries = [...boundaries].sort((a, b) => a - b);

  return sortedBoundaries.flatMap((start, index) => {
    const end = sortedBoundaries[index + 1];
    if (end === undefined || start === end) {
      return [];
    }

    const text = fullText.slice(start, end);
    if (!text) {
      return [];
    }

    const run = runRanges.find((range) => start >= range.start && end <= range.end);
    const highlighted = textRefs.some((ref) => start >= ref.start && end <= ref.end);

    return [
      {
        text,
        styles: run?.styles,
        highlighted,
      },
    ];
  });
}

function getTextSegmentStyle(styles?: FixtureTextRun['styles']): CSSProperties {
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

function buildOutlineSections(segments: DocSegment[]): OutlineSection[] {
  const sections: OutlineSection[] = [];
  let currentSection: OutlineSection | null = null;

  segments.forEach((segment) => {
    if (segment.kind === 'table') {
      sections.push({
        id: `section-${segment.id}`,
        title: 'Table',
        segments: [segment],
      });
      currentSection = null;
      return;
    }

    const isHeading = segment.block.type === 'heading' && getBlockText(segment.block).length > 0;
    if (isHeading) {
      currentSection = {
        id: `section-${segment.id}`,
        title: getBlockText(segment.block),
        segments: [segment],
      };
      sections.push(currentSection);
      return;
    }

    if (!currentSection) {
      currentSection = {
        id: `section-${segment.id}`,
        title: getBlockText(segment.block) || 'Section',
        segments: [],
      };
      sections.push(currentSection);
    }

    currentSection.segments.push(segment);
  });

  return sections;
}

function buildListItemPresentations(
  blocks: FixtureContentBlock[]
): Record<string, ListItemPresentation> {
  const presentations: Record<string, ListItemPresentation> = {};
  const orderedCounts = new Map<number, number>();

  [...blocks]
    .sort((left, right) => left.position - right.position)
    .forEach((block) => {
      if (block.type !== 'listItem' || !block.bullet) {
        orderedCounts.clear();
        return;
      }

      const nestingLevel = Math.max(0, block.bullet.nestingLevel ?? 0);

      Array.from(orderedCounts.keys()).forEach((level) => {
        if (level > nestingLevel) {
          orderedCounts.delete(level);
        }
      });

      if (block.bullet.ordered) {
        const nextCount = (orderedCounts.get(nestingLevel) ?? 0) + 1;
        orderedCounts.set(nestingLevel, nextCount);
        presentations[block.id] = {
          marker: `${nextCount}.`,
          nestingLevel,
        };
        return;
      }

      orderedCounts.delete(nestingLevel);
      presentations[block.id] = {
        marker: nestingLevel > 0 ? '◦' : '•',
        nestingLevel,
      };
    });

  return presentations;
}

export const GoogleDocsMappingReviewScreen = ({
  fixture,
  onBack,
  showChrome = true,
}: GoogleDocsMappingReviewScreenProps) => {
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number | null>(null);
  const [cardOffsetsBySection, setCardOffsetsBySection] = useState<
    Record<string, Record<string, number>>
  >({});
  const sectionLayoutRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const cardWrapperRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const document = fixture.editableNormalizedDocument;
  const sourceUsage = useMemo(() => buildUsageIndexes(fixture), [fixture]);

  const segments = useMemo<DocSegment[]>(() => {
    const blockSegments: DocSegment[] = document.contentBlocks.map((block) => ({
      kind: 'block',
      id: block.id,
      position: block.position,
      block,
    }));
    const tableSegments: DocSegment[] = document.tables.map((table) => ({
      kind: 'table',
      id: table.id,
      position: table.position,
      table,
    }));

    return [...blockSegments, ...tableSegments].sort((a, b) => a.position - b.position);
  }, [document.contentBlocks, document.tables]);

  const sections = useMemo(() => buildOutlineSections(segments), [segments]);

  const imageById = useMemo(() => {
    const images = document.images ?? [];
    return images.reduce<Record<string, (typeof images)[number]>>((acc, image) => {
      acc[image.id] = image;
      return acc;
    }, {});
  }, [document.images]);

  const listItemPresentations = useMemo(
    () => buildListItemPresentations(document.contentBlocks),
    [document.contentBlocks]
  );

  const getVisibleUsage = <T extends FixtureUsageItem>(usage: T[]): T[] => {
    if (selectedEntryIndex === null) {
      return usage;
    }
    return usage.filter((item) => item.entryIndex === selectedEntryIndex);
  };

  const getUsageForSegment = (segment: DocSegment): SourceUsage[] => {
    if (segment.kind === 'table') {
      return uniqueUsage(sourceUsage.tableUsage[segment.id] ?? []);
    }

    return uniqueUsage(sourceUsage.blockUsage[segment.id] ?? []);
  };

  const getUsageForSection = (section: OutlineSection): FixtureUsageItem[] =>
    uniqueUsage(section.segments.flatMap(getUsageForSegment));

  const getMappingCardsForSection = (section: OutlineSection): AnchoredMappingCard[] =>
    getVisibleUsage(getUsageForSection(section)).map((usage) => {
      return {
        key: `${section.id}-${usage.entryIndex}-${usage.fieldId}`,
        fieldName: formatDisplayName(usage.fieldId),
        fieldType: formatDisplayName(usage.fieldType),
        anchorId: getAnchorIdForSourceRef(usage.sourceRef),
      };
    });

  const mappingCardsBySection = useMemo(
    () =>
      sections.reduce<Record<string, AnchoredMappingCard[]>>((acc, section) => {
        acc[section.id] = getMappingCardsForSection(section);
        return acc;
      }, {}),
    [sections, selectedEntryIndex, fixture, sourceUsage]
  );

  const setSectionLayoutRef =
    (sectionId: string): RefCallback<HTMLDivElement> =>
    (node) => {
      sectionLayoutRefs.current[sectionId] = node;
    };

  const setCardWrapperRef =
    (cardKey: string): RefCallback<HTMLDivElement> =>
    (node) => {
      cardWrapperRefs.current[cardKey] = node;
    };

  useLayoutEffect(() => {
    const measureOffsets = () => {
      const nextOffsets: Record<string, Record<string, number>> = {};

      sections.forEach((section) => {
        const sectionNode = sectionLayoutRefs.current[section.id];
        const sectionCards = mappingCardsBySection[section.id] ?? [];

        if (!sectionNode || sectionCards.length === 0) {
          return;
        }

        const sectionTop = sectionNode.getBoundingClientRect().top;
        const anchorNodes = Array.from(
          sectionNode.querySelectorAll<HTMLElement>('[data-anchor-id]')
        );

        const cards = sectionCards.map((card) => {
          const anchorNode = anchorNodes.find(
            (node) => node.getAttribute('data-anchor-id') === card.anchorId
          );
          const wrapperNode = cardWrapperRefs.current[card.key];
          const rawTop = anchorNode
            ? Math.max(0, anchorNode.getBoundingClientRect().top - sectionTop)
            : 0;
          const height =
            wrapperNode?.getBoundingClientRect().height || wrapperNode?.offsetHeight || 28;

          return {
            key: card.key,
            rawTop,
            height,
          };
        });

        nextOffsets[section.id] = resolveMarkerOffsets(cards);
      });

      setCardOffsetsBySection(nextOffsets);
    };

    measureOffsets();
    window.addEventListener('resize', measureOffsets);

    return () => {
      window.removeEventListener('resize', measureOffsets);
    };
  }, [mappingCardsBySection, sections]);

  const renderBlock = (block: FixtureContentBlock) => {
    const visibleRefs = getVisibleUsage(sourceUsage.blockUsage[block.id] ?? []).map(
      (usage) => usage.sourceRef
    );
    const textRefs = visibleRefs.filter((ref) => ref.kind === 'blockText');
    const segments = buildTextSegments(block.textRuns, textRefs);
    const listItemPresentation = block.type === 'listItem' ? listItemPresentations[block.id] : null;

    const renderedText = (
      <Text as="p" marginBottom="none">
        {segments.map((segment, index) => (
          <Box
            as="span"
            key={`${block.id}-${index}`}
            data-testid={`block-segment-${block.id}-${index}`}
            data-highlighted={segment.highlighted ? 'true' : 'false'}
            style={{
              ...getTextSegmentStyle(segment.styles),
              backgroundColor: segment.highlighted ? tokens.green200 : 'transparent',
              borderRadius: segment.highlighted ? tokens.borderRadiusSmall : undefined,
              whiteSpace: 'pre-wrap',
            }}>
            {segment.text}
          </Box>
        ))}
      </Text>
    );

    return (
      <Box>
        {listItemPresentation ? (
          <Flex
            data-testid={`list-item-${block.id}`}
            alignItems="flex-start"
            gap="spacing2Xs"
            style={{
              marginInlineStart:
                listItemPresentation.nestingLevel > 0
                  ? `calc(${tokens.spacingM} * ${listItemPresentation.nestingLevel})`
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
              {listItemPresentation.marker}
            </Text>
            <Box style={{ minWidth: 0, flex: 1 }}>{renderedText}</Box>
          </Flex>
        ) : (
          renderedText
        )}

        {block.imageIds.map((imageId) => {
          const image = imageById[imageId];
          if (!image) return null;
          const highlighted = visibleRefs.some(
            (ref) => ref.kind === 'blockImage' && ref.imageId === imageId
          );

          return (
            <Box key={image.id} marginTop="spacingS">
              <Box
                as="img"
                src={image.url}
                alt={image.altText ?? image.title ?? 'Document image'}
                data-highlighted={highlighted ? 'true' : 'false'}
                style={{
                  width: '100%',
                  maxHeight: 280,
                  objectFit: 'contain',
                  borderRadius: tokens.borderRadiusMedium,
                  border: `2px solid ${highlighted ? tokens.green500 : tokens.gray300}`,
                  backgroundColor: tokens.gray100,
                }}
              />
            </Box>
          );
        })}
      </Box>
    );
  };

  const renderTablePart = (
    table: FixtureTable,
    rowId: string,
    cellId: string,
    part: FixtureTablePart
  ) => {
    const usageKey = [table.id, rowId, cellId, part.id].join(':');
    const visibleRefs = getVisibleUsage(sourceUsage.tablePartUsage[usageKey] ?? []).map(
      (usage) => usage.sourceRef
    );

    if (part.type === 'image') {
      const image = imageById[part.imageId];
      const highlighted = visibleRefs.some((ref) => ref.kind === 'tableImage');

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
            data-highlighted={highlighted ? 'true' : 'false'}
            style={{
              width: '100%',
              maxWidth: 180,
              objectFit: 'contain',
              borderRadius: tokens.borderRadiusMedium,
              border: `2px solid ${highlighted ? tokens.green500 : tokens.gray300}`,
              backgroundColor: tokens.gray100,
            }}
          />
        </Box>
      );
    }

    const segments = buildTextSegments(part.textRuns, visibleRefs);

    return (
      <Box as="span" style={{ whiteSpace: 'pre-wrap' }}>
        {segments.map((segment, index) => (
          <Box
            as="span"
            key={`${part.id}-${index}`}
            data-testid={`table-text-segment-${part.id}-${index}`}
            data-highlighted={segment.highlighted ? 'true' : 'false'}
            style={{
              ...getTextSegmentStyle(segment.styles),
              backgroundColor: segment.highlighted ? tokens.green200 : 'transparent',
              borderRadius: segment.highlighted ? tokens.borderRadiusSmall : undefined,
              whiteSpace: 'pre-wrap',
            }}>
            {segment.text}
          </Box>
        ))}
      </Box>
    );
  };

  const renderTable = (table: FixtureTable) => (
    <Table>
      {table.headers.length > 0 && (
        <TableHead>
          <TableRow>
            {table.headers.map((header, headerIndex) => (
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
            {row.cells.map((cell) => {
              return (
                <TableCell
                  key={cell.id}
                  data-testid={`table-cell-${cell.id}`}
                  style={{
                    backgroundColor: 'transparent',
                    verticalAlign: 'top',
                  }}>
                  <Flex flexDirection="column" gap="spacing2Xs">
                    {cell.parts.map((part) => (
                      <Box key={part.id}>{renderTablePart(table, row.id, cell.id, part)}</Box>
                    ))}
                  </Flex>
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Flex flexDirection="column" gap="spacingM" style={{ padding: tokens.spacingL }}>
      {showChrome ? (
        <Flex justifyContent="space-between" alignItems="center">
          <Text fontWeight="fontWeightDemiBold">Google Docs Mapping Review</Text>
          {onBack ? (
            <Button variant="secondary" size="small" onClick={onBack}>
              Back
            </Button>
          ) : null}
        </Flex>
      ) : null}

      <Card
        padding="none"
        style={{
          minHeight: '70vh',
          overflow: 'auto',
          border: `1px solid ${tokens.gray300}`,
        }}>
        <Box padding="spacingM" style={{ borderBottom: `1px solid ${tokens.gray300}` }}>
          <Text fontWeight="fontWeightDemiBold">Document outline</Text>
          <Text as="p" fontColor="gray600" marginBottom="none">
            {document.title ?? document.documentId}
          </Text>
          <Flex marginTop="spacingS" gap="spacing2Xs" flexWrap="wrap">
            <Button
              size="small"
              variant={selectedEntryIndex === null ? 'primary' : 'secondary'}
              onClick={() => setSelectedEntryIndex(null)}>
              All mappings
            </Button>
            {fixture.entries.map((entry, entryIndex) => (
              <Button
                key={entry.tempId ?? `${entry.contentTypeId}-${entryIndex}`}
                size="small"
                variant={selectedEntryIndex === entryIndex ? 'primary' : 'secondary'}
                onClick={() => setSelectedEntryIndex(entryIndex)}>
                {getEntryDisplayTitle(entry)}
              </Button>
            ))}
          </Flex>
        </Box>

        <Flex
          flexDirection="column"
          gap="spacingS"
          style={{ padding: tokens.spacingM, marginTop: tokens.spacingM }}>
          {sections.map((section) => {
            const visibleUsage = getVisibleUsage(getUsageForSection(section));
            const mappingCards = getMappingCardsForSection(section);
            const isMapped = visibleUsage.length > 0;
            const isTableSection = section.segments.every((segment) => segment.kind === 'table');

            return (
              <Box key={section.id}>
                <Flex
                  gap="spacingM"
                  alignItems="stretch"
                  data-testid={`section-layout-${section.id}`}
                  ref={setSectionLayoutRef(section.id)}>
                  <Box style={{ flex: 2 }}>
                    <Box data-testid={`section-surface-${section.id}`}>
                      <Flex
                        flexDirection="column"
                        gap="spacingXs"
                        marginTop={isTableSection ? 'none' : 'spacingXs'}>
                        {section.segments.map((segment) => (
                          <Box
                            key={`${segment.kind}-${segment.id}`}
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
                              ? renderTable(segment.table)
                              : renderBlock(segment.block)}
                          </Box>
                        ))}
                      </Flex>
                    </Box>
                  </Box>

                  <Box
                    data-testid={`mapping-rail-${section.id}`}
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
                                top: cardOffsetsBySection[section.id]?.[mappingCard.key] ?? 0,
                              }}>
                              <MappingCard card={mappingCard} />
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
      </Card>
    </Flex>
  );
};
