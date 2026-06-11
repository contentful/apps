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
  ImageSourceRef,
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
import { tableCellChromeMapped, tableCellChromeMappedHovered } from './documentRenderers.styles';

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

function getTextSegmentHighlightCss(
  highlighted: boolean,
  hovered: boolean,
  isViewMode: boolean
): Pick<CSSProperties, 'backgroundColor' | 'padding' | 'boxShadow'> {
  if (!highlighted || isViewMode) return {};

  return {
    backgroundColor: hovered ? tokens.green300 : tokens.green100,
    padding: `${tokens.spacing2Xs} 0`,
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
  isViewMode: boolean;
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
  isViewMode,
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
  const highlightCss = getTextSegmentHighlightCss(segment.highlighted, hovered, isViewMode);
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
        ...highlightCss,
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
  isViewMode: boolean;
  onSetHoveredMappingKeys: (keys: string[]) => void;
  onEditImage?: (sourceRef: ImageSourceRef, label: string) => void;
  onRemoveImage?: (sourceRef: ImageSourceRef) => void;
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
  isViewMode,
  onSetHoveredMappingKeys,
  onEditImage,
  onRemoveImage,
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
          isViewMode={isViewMode}
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
              isViewMode={isViewMode}
              onMouseEnter={
                highlighted ? () => onSetHoveredMappingKeys(imageMappingKeys) : undefined
              }
              onMouseLeave={highlighted ? () => onSetHoveredMappingKeys([]) : undefined}
              onEdit={
                onEditImage
                  ? () => onEditImage(imageSourceRef, image.title ?? image.altText ?? image.id)
                  : undefined
              }
              onRemove={
                highlighted && onRemoveImage ? () => onRemoveImage(imageSourceRef) : undefined
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
  /** Full (unfiltered) highlight index for per-cell border computation in view mode. */
  fullHighlightIndex?: MappingHighlightIndex;
  imageById: Record<string, NormalizedDocumentImage>;
  excludedSourceRefs: SourceRef[];
  selectedEntryIndex: number | null;
  hoveredMappingKeys: string[];
  isViewMode: boolean;
  onSetHoveredMappingKeys: (keys: string[]) => void;
  onEditImage?: (sourceRef: ImageSourceRef, label: string) => void;
  onRemoveImage?: (sourceRef: ImageSourceRef) => void;
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
  isViewMode: boolean;
  onSetHoveredMappingKeys: (keys: string[]) => void;
  onEditImage?: TableRendererProps['onEditImage'];
  onRemoveImage?: TableRendererProps['onRemoveImage'];
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
  isViewMode,
  onSetHoveredMappingKeys,
  onEditImage,
  onRemoveImage,
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
          isViewMode={isViewMode}
          size="small"
          onMouseEnter={highlighted ? () => onSetHoveredMappingKeys(mappingKeys) : undefined}
          onMouseLeave={highlighted ? () => onSetHoveredMappingKeys([]) : undefined}
          onEdit={
            onEditImage
              ? () => onEditImage(imageSourceRef, image.title ?? image.altText ?? image.id)
              : undefined
          }
          onRemove={highlighted && onRemoveImage ? () => onRemoveImage(imageSourceRef) : undefined}
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
          isViewMode={isViewMode}
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
  fullHighlightIndex,
  imageById,
  excludedSourceRefs,
  selectedEntryIndex,
  hoveredMappingKeys,
  isViewMode,
  onSetHoveredMappingKeys,
  onEditImage,
  onRemoveImage,
}: TableRendererProps) => {
  const borderIndex = fullHighlightIndex ?? highlightIndex;

  const getVisiblePartHighlights = (partKey: string) =>
    filterByEntry(highlightIndex.tablePartHighlights[partKey] ?? [], selectedEntryIndex);

  const getCellMappingKeys = (rowId: string, cellId: string): string[] => {
    const keys: string[] = [];
    const row = table.rows.find((r) => r.id === rowId);
    const cell = row?.cells.find((c) => c.id === cellId);
    cell?.parts.forEach((part) => {
      const partKey = [table.id, rowId, cellId, part.id].join(':');
      filterByEntry(borderIndex.tablePartHighlights[partKey] ?? [], selectedEntryIndex).forEach(
        (h) => {
          keys.push(getMappingCardKey(segmentId, h));
        }
      );
    });
    return Array.from(new Set(keys));
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
              const cellMappingKeys = getCellMappingKeys(row.id, cell.id);
              const hasCellMapping = cellMappingKeys.length > 0;
              const isCellSurfaceHovered =
                isViewMode && isMappingHovered(cellMappingKeys, hoveredMappingKeys);

              const cellBody = (
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
                          isViewMode={isViewMode}
                          onSetHoveredMappingKeys={onSetHoveredMappingKeys}
                          onEditImage={onEditImage}
                          onRemoveImage={onRemoveImage}
                        />
                      </Box>
                    );
                  })}
                </Flex>
              );

              const viewModeChrome = hasCellMapping ? (
                <Box
                  data-testid={`table-cell-mapping-surface-${cell.id}`}
                  className={
                    isCellSurfaceHovered ? tableCellChromeMappedHovered : tableCellChromeMapped
                  }>
                  {cellBody}
                </Box>
              ) : (
                cellBody
              );

              return (
                <TableCell
                  key={cell.id}
                  data-testid={`table-cell-${cell.id}`}
                  style={{ backgroundColor: 'transparent', verticalAlign: 'top' }}>
                  {isViewMode ? viewModeChrome : cellBody}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
