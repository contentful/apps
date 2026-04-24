import type { CSSProperties } from 'react';
import {
  Box,
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
  NormalizedDocumentContentBlock,
  NormalizedDocumentImage,
  NormalizedDocumentTable,
  NormalizedDocumentTablePart,
  SourceRef,
  TextSourceRef,
} from '@types';
import { isBlockImageSourceRef, isTableImageSourceRef, isTextSourceRef } from '@types';
import type { MappingHighlight, MappingHighlightIndex } from './buildHighlights';
import { getMappingCardKey } from './buildHighlights';
import type { ListMarker } from './buildListMarkers';
import { buildTextSegments, type TextSegment } from './buildTextSegments';
import { getAnchorIdForSourceRef } from './resolveMappingCardOffsets';
import { ReviewImageAssetCard } from './ReviewImageAssetCard';
import { isImageSourceRefExcluded } from './sourceRefUtils';

// ─── Shared helpers ─────────────────────────────────────────────────────────

function filterByEntry<T extends MappingHighlight>(
  highlights: T[],
  selectedEntryIndex: number | null
): T[] {
  return selectedEntryIndex === null
    ? highlights
    : highlights.filter((h) => h.entryIndex === selectedEntryIndex);
}

function isMappingHovered(keys: string[], hoveredMappingKeys: string[]): boolean {
  return keys.some((k) => hoveredMappingKeys.includes(k));
}

function getFieldIdentity(highlight: MappingHighlight): string {
  return `${highlight.entryIndex}|${highlight.fieldId}|${highlight.fieldType}`;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

const GROUPABLE_SEPARATOR_PATTERN = /^[\s/|,:;()[\]{}\-–—]+$/;

function getTextSliceFromRuns(
  flattenedRuns: Array<{ start: number; end: number; text: string }>,
  from: number,
  to: number
): string {
  if (to <= from) {
    return '';
  }

  return flattenedRuns
    .flatMap((run) => {
      const overlapStart = Math.max(from, run.start);
      const overlapEnd = Math.min(to, run.end);

      if (overlapEnd <= overlapStart) {
        return [];
      }

      return [run.text.slice(overlapStart - run.start, overlapEnd - run.start)];
    })
    .join('');
}

function isOnlyGroupableSeparators(value: string): boolean {
  return value.length === 0 || GROUPABLE_SEPARATOR_PATTERN.test(value);
}

function getHighlightStyle(highlighted: boolean, hovered: boolean, readOnly = false) {
  if (!highlighted) return { border: 'transparent', background: 'transparent' };
  if (readOnly) {
    return {
      border: hovered ? tokens.green600 : tokens.green500,
      background: 'transparent',
      boxShadow: hovered ? `inset 0 0 0 1px ${tokens.green600}` : undefined,
    };
  }
  return {
    border: hovered ? tokens.green600 : tokens.green500,
    background: tokens.green100,
    boxShadow: hovered ? `inset 0 0 0 1px ${tokens.green600}` : undefined,
  };
}

// ─── TextSegmentSpan ────────────────────────────────────────────────────────

function getTextSegmentStyle(styles?: TextSegment['styles']): CSSProperties {
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

interface TextSegmentSpanProps {
  id: string;
  segment: TextSegment;
  hovered: boolean;
  onSetHoveredMappings: (keys: string[]) => void;
  textScope: 'block' | 'table';
  rangeStart: number;
  rangeEnd: number;
  blockId?: string;
  tableId?: string;
  rowId?: string;
  cellId?: string;
  partId?: string;
  readOnly?: boolean;
  suppressInlineHighlight?: boolean;
}

const TextSegmentSpan = ({
  id,
  segment,
  hovered,
  onSetHoveredMappings,
  textScope,
  rangeStart,
  rangeEnd,
  blockId,
  tableId,
  rowId,
  cellId,
  partId,
  readOnly = false,
  suppressInlineHighlight = false,
}: TextSegmentSpanProps) => {
  const highlightStyle = suppressInlineHighlight
    ? { border: 'transparent', background: 'transparent' }
    : getHighlightStyle(segment.highlighted, hovered, readOnly);
  const content = (
    <Box
      as="span"
      key={id}
      data-review-text-segment="true"
      data-is-mapped={segment.highlighted ? 'true' : 'false'}
      data-text-scope={textScope}
      data-range-start={String(rangeStart)}
      data-range-end={String(rangeEnd)}
      data-block-id={blockId ?? undefined}
      data-table-id={tableId ?? undefined}
      data-row-id={rowId ?? undefined}
      data-cell-id={cellId ?? undefined}
      data-part-id={partId ?? undefined}
      data-mapping-keys={segment.mappingKeys.join('|')}
      onMouseEnter={
        segment.highlighted ? () => onSetHoveredMappings(segment.mappingKeys) : undefined
      }
      onMouseLeave={segment.highlighted ? () => onSetHoveredMappings([]) : undefined}
      style={{
        ...getTextSegmentStyle(segment.styles),
        backgroundColor: highlightStyle.background,
        border:
          segment.highlighted && highlightStyle.border !== 'transparent'
            ? `1px solid ${highlightStyle.border}`
            : undefined,
        boxShadow:
          segment.highlighted && highlightStyle.border !== 'transparent'
            ? highlightStyle.boxShadow
            : undefined,
        borderRadius: segment.highlighted ? tokens.borderRadiusSmall : undefined,
        paddingInline:
          segment.highlighted && highlightStyle.border !== 'transparent'
            ? tokens.spacing2Xs
            : undefined,
        paddingBlock:
          segment.highlighted && highlightStyle.border !== 'transparent' ? '1px' : undefined,
        whiteSpace: 'pre-wrap',
        transition: 'background-color 120ms ease, border-color 120ms ease',
      }}>
      {segment.text}
    </Box>
  );

  const linkUrl = segment.styles?.linkUrl?.trim();
  if (!linkUrl) return content;

  return (
    <TextLink key={`link-${id}`} href={linkUrl} target="_blank" rel="noreferrer">
      {content}
    </TextLink>
  );
};

// ─── BlockRenderer ───────────────────────────────────────────────────────────

interface BlockRendererProps {
  segmentId: string;
  block: NormalizedDocumentContentBlock;
  highlightIndex: MappingHighlightIndex;
  listMarkers: Record<string, ListMarker>;
  imageById: Record<string, NormalizedDocumentImage>;
  excludedSourceRefs: SourceRef[];
  selectedEntryIndex: number | null;
  hoveredMappingKeys: string[];
  onSetHoveredMappingKeys: (keys: string[]) => void;
  onAssignImage: (
    sourceRef: { type: 'image'; blockId: string; imageId: string },
    label: string
  ) => void;
  onExcludeImage: (
    sourceRef: { type: 'image'; blockId: string; imageId: string },
    label: string
  ) => void;
  readOnly?: boolean;
  showReadOnlyOutline?: boolean;
  preferImageReadOnlyHighlight?: boolean;
  suppressInlineHighlights?: boolean;
}

export const BlockRenderer = ({
  segmentId,
  block,
  highlightIndex,
  listMarkers,
  imageById,
  excludedSourceRefs,
  selectedEntryIndex,
  hoveredMappingKeys,
  onSetHoveredMappingKeys,
  onAssignImage,
  onExcludeImage,
  readOnly = false,
  showReadOnlyOutline = true,
  preferImageReadOnlyHighlight = false,
  suppressInlineHighlights = false,
}: BlockRendererProps) => {
  const visibleHighlights = filterByEntry(
    highlightIndex.blockHighlights[block.id] ?? [],
    selectedEntryIndex
  );
  const visibleTextHighlights = visibleHighlights.filter(
    (highlight): highlight is MappingHighlight & { sourceRef: TextSourceRef } =>
      isTextSourceRef(highlight.sourceRef)
  );
  const hasVisibleTextMappings = visibleTextHighlights.length > 0;
  const blockMappingKeys = visibleHighlights.map((highlight) =>
    getMappingCardKey(segmentId, highlight)
  );
  const isBlockHovered = isMappingHovered(blockMappingKeys, hoveredMappingKeys);
  const textSegments = buildTextSegments(block.flattenedTextRuns, segmentId, visibleHighlights);
  const listMarker = block.type === 'listItem' ? listMarkers[block.id] ?? null : null;

  const renderedText = (
    <Text as="p" marginBottom="none">
      {textSegments.map((seg, index) => (
        <TextSegmentSpan
          key={`${block.id}-${index}`}
          id={`${block.id}-${index}`}
          segment={seg}
          hovered={isMappingHovered(seg.mappingKeys, hoveredMappingKeys)}
          onSetHoveredMappings={onSetHoveredMappingKeys}
          textScope="block"
          rangeStart={seg.start}
          rangeEnd={seg.end}
          blockId={block.id}
          readOnly={readOnly}
          suppressInlineHighlight={
            suppressInlineHighlights || (readOnly && showReadOnlyOutline && hasVisibleTextMappings)
          }
        />
      ))}
    </Text>
  );

  return (
    <Box
      data-review-alignment-target={
        readOnly && showReadOnlyOutline && hasVisibleTextMappings ? 'true' : undefined
      }
      onMouseEnter={
        readOnly && blockMappingKeys.length > 0
          ? () => onSetHoveredMappingKeys(blockMappingKeys)
          : undefined
      }
      onMouseLeave={
        readOnly && blockMappingKeys.length > 0 ? () => onSetHoveredMappingKeys([]) : undefined
      }
      style={
        readOnly && showReadOnlyOutline && hasVisibleTextMappings
          ? {
              border: `1px solid ${isBlockHovered ? tokens.green600 : tokens.green500}`,
              borderRadius: tokens.borderRadiusMedium,
              backgroundColor: 'transparent',
              padding: tokens.spacing2Xs,
              boxShadow: isBlockHovered ? `inset 0 0 0 1px ${tokens.green600}` : undefined,
              transition: 'border-color 120ms ease, box-shadow 120ms ease',
            }
          : undefined
      }>
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
            style={{ minWidth: tokens.spacingM, lineHeight: tokens.lineHeightM, flex: '0 0 auto' }}>
            {listMarker.marker}
          </Text>
          <Box style={{ minWidth: 0, flex: 1 }}>{renderedText}</Box>
        </Flex>
      ) : (
        renderedText
      )}

      {block.imageIds.map((imageId) => {
        const image = imageById[imageId];
        if (!image) return null;

        const imageSourceRef = {
          type: 'image' as const,
          blockId: block.id,
          imageId,
        };
        const imageMappingKeys = visibleHighlights
          .filter((h) => isBlockImageSourceRef(h.sourceRef) && h.sourceRef.imageId === imageId)
          .map((h) => getMappingCardKey(segmentId, h));
        const highlighted = imageMappingKeys.length > 0;
        const hovered = isMappingHovered(imageMappingKeys, hoveredMappingKeys);

        return (
          <Box
            key={image.id}
            marginTop="spacingS"
            data-review-image-segment="true"
            data-is-mapped={highlighted ? 'true' : 'false'}
            data-image-scope="block"
            data-block-id={block.id}
            data-image-id={imageId}
            data-mapping-keys={imageMappingKeys.join('|')}>
            <ReviewImageAssetCard
              image={image}
              sourceRef={imageSourceRef}
              isHighlighted={highlighted}
              hovered={hovered}
              isExcluded={isImageSourceRefExcluded(imageSourceRef, excludedSourceRefs)}
              readOnly={readOnly}
              showReadOnlyHighlightBorder={
                readOnly && (preferImageReadOnlyHighlight || !hasVisibleTextMappings)
              }
              onMouseEnter={
                highlighted ? () => onSetHoveredMappingKeys(imageMappingKeys) : undefined
              }
              onMouseLeave={highlighted ? () => onSetHoveredMappingKeys([]) : undefined}
              onAssign={() =>
                onAssignImage(imageSourceRef, image.title ?? image.altText ?? image.id)
              }
              onExclude={() =>
                onExcludeImage(imageSourceRef, image.title ?? image.altText ?? image.id)
              }
            />
          </Box>
        );
      })}
    </Box>
  );
};

// ─── TableRenderer ───────────────────────────────────────────────────────────

interface TableRendererProps {
  segmentId: string;
  table: NormalizedDocumentTable;
  highlightIndex: MappingHighlightIndex;
  imageById: Record<string, NormalizedDocumentImage>;
  excludedSourceRefs: SourceRef[];
  selectedEntryIndex: number | null;
  hoveredMappingKeys: string[];
  onSetHoveredMappingKeys: (keys: string[]) => void;
  onAssignImage: (
    sourceRef: {
      type: 'tableImage';
      tableId: string;
      rowId: string;
      cellId: string;
      partId: string;
      imageId: string;
    },
    label: string
  ) => void;
  onExcludeImage: (
    sourceRef: {
      type: 'tableImage';
      tableId: string;
      rowId: string;
      cellId: string;
      partId: string;
      imageId: string;
    },
    label: string
  ) => void;
  readOnly?: boolean;
  showReadOnlyOutline?: boolean;
  preferImageReadOnlyHighlight?: boolean;
  suppressInlineHighlights?: boolean;
}

interface TablePartRendererProps {
  segmentId: string;
  tableId: string;
  rowId: string;
  cellId: string;
  anchorId?: string;
  part: NormalizedDocumentTablePart;
  visibleHighlights: MappingHighlight[];
  imageById: Record<string, NormalizedDocumentImage>;
  excludedSourceRefs: SourceRef[];
  hoveredMappingKeys: string[];
  onSetHoveredMappingKeys: (keys: string[]) => void;
  onAssignImage: TableRendererProps['onAssignImage'];
  onExcludeImage: TableRendererProps['onExcludeImage'];
  readOnly?: boolean;
  showReadOnlyOutline?: boolean;
  suppressInlineHighlights?: boolean;
}

const TablePartRenderer = ({
  segmentId,
  tableId,
  rowId,
  cellId,
  anchorId,
  part,
  visibleHighlights,
  imageById,
  excludedSourceRefs,
  hoveredMappingKeys,
  onSetHoveredMappingKeys,
  onAssignImage,
  onExcludeImage,
  readOnly = false,
  showReadOnlyOutline = true,
  suppressInlineHighlights = false,
}: TablePartRendererProps) => {
  const partMappingKeys = visibleHighlights.map((highlight) =>
    getMappingCardKey(segmentId, highlight)
  );
  const hasVisibleMappings = partMappingKeys.length > 0;
  const isPartHovered = isMappingHovered(partMappingKeys, hoveredMappingKeys);
  const showEditModeFullSurface =
    !readOnly &&
    suppressInlineHighlights &&
    showReadOnlyOutline &&
    part.type === 'text' &&
    hasVisibleMappings;

  if (part.type === 'image') {
    const image = imageById[part.imageId];
    if (!image) return null;

    const imageSourceRef = {
      type: 'tableImage' as const,
      tableId,
      rowId,
      cellId,
      partId: part.id,
      imageId: part.imageId,
    };
    const mappingKeys = visibleHighlights
      .filter(
        (h) =>
          isTableImageSourceRef(h.sourceRef) &&
          h.sourceRef.tableId === tableId &&
          h.sourceRef.rowId === rowId &&
          h.sourceRef.cellId === cellId &&
          h.sourceRef.partId === part.id &&
          h.sourceRef.imageId === part.imageId
      )
      .map((h) => getMappingCardKey(segmentId, h));
    const highlighted = mappingKeys.length > 0;
    const hovered = isMappingHovered(mappingKeys, hoveredMappingKeys);

    return (
      <Box
        marginTop="spacing2Xs"
        data-review-image-segment="true"
        data-is-mapped={highlighted ? 'true' : 'false'}
        data-image-scope="table"
        data-table-id={tableId}
        data-row-id={rowId}
        data-cell-id={cellId}
        data-part-id={part.id}
        data-image-id={part.imageId}
        data-mapping-keys={mappingKeys.join('|')}>
        <ReviewImageAssetCard
          image={image}
          sourceRef={imageSourceRef}
          isHighlighted={highlighted}
          hovered={hovered}
          isExcluded={isImageSourceRefExcluded(imageSourceRef, excludedSourceRefs)}
          size="small"
          readOnly={readOnly}
          showReadOnlyHighlightBorder={readOnly}
          onMouseEnter={highlighted ? () => onSetHoveredMappingKeys(mappingKeys) : undefined}
          onMouseLeave={highlighted ? () => onSetHoveredMappingKeys([]) : undefined}
          onAssign={() => onAssignImage(imageSourceRef, image.title ?? image.altText ?? image.id)}
          onExclude={() => onExcludeImage(imageSourceRef, image.title ?? image.altText ?? image.id)}
        />
      </Box>
    );
  }

  const textSegments = buildTextSegments(part.flattenedTextRuns, segmentId, visibleHighlights);

  return (
    <Box
      as="span"
      id={anchorId}
      data-review-alignment-target={showReadOnlyOutline && hasVisibleMappings ? 'true' : undefined}
      onMouseEnter={
        readOnly && partMappingKeys.length > 0
          ? () => onSetHoveredMappingKeys(partMappingKeys)
          : undefined
      }
      onMouseLeave={
        readOnly && partMappingKeys.length > 0 ? () => onSetHoveredMappingKeys([]) : undefined
      }
      style={{
        whiteSpace: 'pre-wrap',
        display: 'inline-block',
        ...((readOnly && showReadOnlyOutline && hasVisibleMappings) || showEditModeFullSurface
          ? {
              border: `1px solid ${isPartHovered ? tokens.green600 : tokens.green500}`,
              borderRadius: tokens.borderRadiusMedium,
              backgroundColor: readOnly ? 'transparent' : tokens.green100,
              padding: tokens.spacingXs,
              boxShadow: isPartHovered ? `inset 0 0 0 1px ${tokens.green600}` : undefined,
              transition: 'border-color 120ms ease, box-shadow 120ms ease',
            }
          : undefined),
      }}>
      {textSegments.map((seg, index) => (
        <TextSegmentSpan
          key={`${part.id}-${index}`}
          id={`${part.id}-${index}`}
          segment={seg}
          hovered={isMappingHovered(seg.mappingKeys, hoveredMappingKeys)}
          onSetHoveredMappings={onSetHoveredMappingKeys}
          textScope="table"
          rangeStart={seg.start}
          rangeEnd={seg.end}
          tableId={tableId}
          rowId={rowId}
          cellId={cellId}
          partId={part.id}
          readOnly={readOnly}
          suppressInlineHighlight={
            suppressInlineHighlights || (readOnly && showReadOnlyOutline && hasVisibleMappings)
          }
        />
      ))}
    </Box>
  );
};

export const TableRenderer = ({
  segmentId,
  table,
  highlightIndex,
  imageById,
  excludedSourceRefs,
  selectedEntryIndex,
  hoveredMappingKeys,
  onSetHoveredMappingKeys,
  onAssignImage,
  onExcludeImage,
  readOnly = false,
  showReadOnlyOutline = true,
  preferImageReadOnlyHighlight = false,
  suppressInlineHighlights = false,
}: TableRendererProps) => {
  const getVisiblePartHighlights = (partKey: string) =>
    filterByEntry(highlightIndex.tablePartHighlights[partKey] ?? [], selectedEntryIndex);

  const hasFullPartTextCoverage = (
    part: Extract<NormalizedDocumentTablePart, { type: 'text' }>,
    highlights: MappingHighlight[]
  ) => {
    const textHighlights = highlights.filter(
      (
        highlight
      ): highlight is MappingHighlight & {
        sourceRef: Extract<MappingHighlight['sourceRef'], { start: number; end: number }>;
      } => isTextSourceRef(highlight.sourceRef)
    );

    if (!textHighlights.length || textHighlights.length !== highlights.length) {
      return false;
    }

    const partStart = part.flattenedTextRuns[0]?.start;
    const partEnd = part.flattenedTextRuns[part.flattenedTextRuns.length - 1]?.end;

    if (!Number.isFinite(partStart) || !Number.isFinite(partEnd)) {
      return false;
    }

    const sortedHighlights = [...textHighlights].sort(
      (left, right) => left.sourceRef.start - right.sourceRef.start
    );
    let coverageEnd = sortedHighlights[0].sourceRef.end;

    if (
      !isOnlyGroupableSeparators(
        getTextSliceFromRuns(part.flattenedTextRuns, partStart, sortedHighlights[0].sourceRef.start)
      )
    ) {
      return false;
    }

    for (let index = 1; index < sortedHighlights.length; index += 1) {
      const highlight = sortedHighlights[index];
      if (
        !isOnlyGroupableSeparators(
          getTextSliceFromRuns(part.flattenedTextRuns, coverageEnd, highlight.sourceRef.start)
        )
      ) {
        return false;
      }
      coverageEnd = Math.max(coverageEnd, highlight.sourceRef.end);
    }

    return isOnlyGroupableSeparators(
      getTextSliceFromRuns(part.flattenedTextRuns, coverageEnd, partEnd)
    );
  };

  const getPartFieldIdentity = (
    part: NormalizedDocumentTablePart,
    highlights: MappingHighlight[]
  ) => {
    const uniqueFieldIdentities = new Set(highlights.map(getFieldIdentity));
    if (uniqueFieldIdentities.size !== 1) {
      return null;
    }

    if (part.type === 'image') {
      return Array.from(uniqueFieldIdentities)[0];
    }

    return hasFullPartTextCoverage(part, highlights) ? Array.from(uniqueFieldIdentities)[0] : null;
  };

  return (
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
            id={`row:${table.id}:${row.id}`}
            data-testid={`table-row-${row.id}`}>
            {row.cells.map((cell) => {
              const partHighlightsByKey = cell.parts.map((part) => {
                const partKey = [table.id, row.id, cell.id, part.id].join(':');
                const highlights = getVisiblePartHighlights(partKey);
                return {
                  part,
                  highlights,
                  fieldIdentity: getPartFieldIdentity(part, highlights),
                  hasFullPartCoverage:
                    part.type === 'text' ? hasFullPartTextCoverage(part, highlights) : false,
                };
              });

              type CellChunk =
                | {
                    kind: 'group';
                    id: string;
                    parts: Array<(typeof partHighlightsByKey)[number]>;
                    mappingKeys: string[];
                  }
                | {
                    kind: 'part';
                    id: string;
                    part: (typeof partHighlightsByKey)[number]['part'];
                    highlights: MappingHighlight[];
                    hasFullPartCoverage: boolean;
                  };

              const chunks: CellChunk[] = [];
              let currentGroup: Extract<CellChunk, { kind: 'group' }> | null = null;

              const flushCurrentGroup = () => {
                if (currentGroup) {
                  chunks.push(currentGroup);
                  currentGroup = null;
                }
              };

              partHighlightsByKey.forEach((partState) => {
                if (partState.fieldIdentity) {
                  const mappingKeys = partState.highlights.map((highlight) =>
                    getMappingCardKey(segmentId, highlight)
                  );

                  if (
                    currentGroup &&
                    currentGroup.parts[0]?.fieldIdentity === partState.fieldIdentity
                  ) {
                    currentGroup.parts.push(partState);
                    currentGroup.mappingKeys = uniqueStrings([
                      ...currentGroup.mappingKeys,
                      ...mappingKeys,
                    ]);
                    return;
                  }

                  flushCurrentGroup();
                  currentGroup = {
                    kind: 'group',
                    id: `${cell.id}:${partState.part.id}:${partState.fieldIdentity}`,
                    parts: [partState],
                    mappingKeys,
                  };
                  return;
                }

                flushCurrentGroup();
                chunks.push({
                  kind: 'part',
                  id: `${cell.id}:${partState.part.id}`,
                  part: partState.part,
                  highlights: partState.highlights,
                  hasFullPartCoverage: partState.hasFullPartCoverage,
                });
              });

              flushCurrentGroup();

              return (
                <TableCell
                  key={cell.id}
                  data-testid={`table-cell-${cell.id}`}
                  style={{ backgroundColor: 'transparent', verticalAlign: 'top' }}>
                  <Flex flexDirection="column" gap="spacing2Xs">
                    {chunks.map((chunk) => {
                      if (chunk.kind === 'group') {
                        const isChunkHovered = isMappingHovered(
                          chunk.mappingKeys,
                          hoveredMappingKeys
                        );
                        const firstHighlight = chunk.parts.flatMap(
                          (partState) => partState.highlights
                        )[0];
                        const chunkAnchorId = firstHighlight
                          ? getAnchorIdForSourceRef(firstHighlight.sourceRef)
                          : undefined;

                        return (
                          <Box
                            key={chunk.id}
                            id={chunkAnchorId}
                            data-review-alignment-target={readOnly ? 'true' : undefined}
                            onMouseEnter={() => onSetHoveredMappingKeys(chunk.mappingKeys)}
                            onMouseLeave={() => onSetHoveredMappingKeys([])}
                            style={{
                              border: `1px solid ${
                                isChunkHovered ? tokens.green600 : tokens.green500
                              }`,
                              borderRadius: tokens.borderRadiusMedium,
                              backgroundColor: readOnly ? 'transparent' : tokens.green100,
                              padding: tokens.spacingXs,
                              boxShadow: isChunkHovered
                                ? `inset 0 0 0 1px ${tokens.green600}`
                                : undefined,
                              transition: 'border-color 120ms ease, box-shadow 120ms ease',
                            }}>
                            <Flex flexDirection="column" gap="spacing2Xs">
                              {chunk.parts.map((partState) => (
                                <Box key={partState.part.id}>
                                  <TablePartRenderer
                                    segmentId={segmentId}
                                    tableId={table.id}
                                    rowId={row.id}
                                    cellId={cell.id}
                                    anchorId={undefined}
                                    part={partState.part}
                                    visibleHighlights={partState.highlights}
                                    imageById={imageById}
                                    excludedSourceRefs={excludedSourceRefs}
                                    hoveredMappingKeys={hoveredMappingKeys}
                                    onSetHoveredMappingKeys={onSetHoveredMappingKeys}
                                    onAssignImage={onAssignImage}
                                    onExcludeImage={onExcludeImage}
                                    readOnly={readOnly}
                                    showReadOnlyOutline={false}
                                    suppressInlineHighlights
                                  />
                                </Box>
                              ))}
                            </Flex>
                          </Box>
                        );
                      }

                      return (
                        <Box key={chunk.id}>
                          <TablePartRenderer
                            segmentId={segmentId}
                            tableId={table.id}
                            rowId={row.id}
                            cellId={cell.id}
                            anchorId={
                              chunk.highlights[0]
                                ? getAnchorIdForSourceRef(chunk.highlights[0].sourceRef)
                                : undefined
                            }
                            part={chunk.part}
                            visibleHighlights={chunk.highlights}
                            imageById={imageById}
                            excludedSourceRefs={excludedSourceRefs}
                            hoveredMappingKeys={hoveredMappingKeys}
                            onSetHoveredMappingKeys={onSetHoveredMappingKeys}
                            onAssignImage={onAssignImage}
                            onExcludeImage={onExcludeImage}
                            readOnly={readOnly}
                            showReadOnlyOutline={
                              chunk.part.type === 'text'
                                ? showReadOnlyOutline && chunk.hasFullPartCoverage
                                : showReadOnlyOutline
                            }
                            suppressInlineHighlights={
                              chunk.part.type === 'text' &&
                              chunk.hasFullPartCoverage &&
                              (suppressInlineHighlights || !readOnly)
                            }
                          />
                        </Box>
                      );
                    })}
                  </Flex>
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
