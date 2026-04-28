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
} from '@types';
import { isBlockImageSourceRef, isTableImageSourceRef } from '@types';
import type { MappingHighlight, MappingHighlightIndex } from './buildHighlights';
import { getMappingCardKey } from './buildHighlights';
import type { ListMarker } from './buildListMarkers';
import { buildTextSegments, type TextSegment } from './buildTextSegments';
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

function getHighlightStyle(highlighted: boolean, hovered: boolean) {
  if (!highlighted) return { border: tokens.gray300, background: 'transparent' };
  return {
    border: hovered ? tokens.green600 : tokens.green500,
    background: hovered ? tokens.green300 : tokens.green200,
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
}: TextSegmentSpanProps) => {
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
        backgroundColor: getHighlightStyle(segment.highlighted, hovered).background,
        borderRadius: segment.highlighted ? tokens.borderRadiusSmall : undefined,
        whiteSpace: 'pre-wrap',
        transition: 'background-color 120ms ease',
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
}: BlockRendererProps) => {
  const visibleHighlights = filterByEntry(
    highlightIndex.blockHighlights[block.id] ?? [],
    selectedEntryIndex
  );
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
        />
      ))}
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
}

interface TablePartRendererProps {
  segmentId: string;
  tableId: string;
  rowId: string;
  cellId: string;
  part: NormalizedDocumentTablePart;
  visibleHighlights: MappingHighlight[];
  imageById: Record<string, NormalizedDocumentImage>;
  excludedSourceRefs: SourceRef[];
  hoveredMappingKeys: string[];
  onSetHoveredMappingKeys: (keys: string[]) => void;
  onAssignImage: TableRendererProps['onAssignImage'];
  onExcludeImage: TableRendererProps['onExcludeImage'];
}

const TablePartRenderer = ({
  segmentId,
  tableId,
  rowId,
  cellId,
  part,
  visibleHighlights,
  imageById,
  excludedSourceRefs,
  hoveredMappingKeys,
  onSetHoveredMappingKeys,
  onAssignImage,
  onExcludeImage,
}: TablePartRendererProps) => {
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
    <Box as="span" style={{ whiteSpace: 'pre-wrap' }}>
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
}: TableRendererProps) => {
  const getVisiblePartHighlights = (partKey: string) =>
    filterByEntry(highlightIndex.tablePartHighlights[partKey] ?? [], selectedEntryIndex);

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
            {row.cells.map((cell) => (
              <TableCell
                key={cell.id}
                data-testid={`table-cell-${cell.id}`}
                style={{ backgroundColor: 'transparent', verticalAlign: 'top' }}>
                <Flex flexDirection="column" gap="spacing2Xs">
                  {cell.parts.map((part) => {
                    const partKey = [table.id, row.id, cell.id, part.id].join(':');
                    return (
                      <Box key={part.id}>
                        <TablePartRenderer
                          segmentId={segmentId}
                          tableId={table.id}
                          rowId={row.id}
                          cellId={cell.id}
                          part={part}
                          visibleHighlights={getVisiblePartHighlights(partKey)}
                          imageById={imageById}
                          excludedSourceRefs={excludedSourceRefs}
                          hoveredMappingKeys={hoveredMappingKeys}
                          onSetHoveredMappingKeys={onSetHoveredMappingKeys}
                          onAssignImage={onAssignImage}
                          onExcludeImage={onExcludeImage}
                        />
                      </Box>
                    );
                  })}
                </Flex>
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
