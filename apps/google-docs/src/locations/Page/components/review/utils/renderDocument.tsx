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
} from '@types';
import { isBlockImageSourceRef, isTableImageSourceRef } from '@types';
import type { MappingHighlight, MappingHighlightIndex } from './buildHighlights';
import { getMappingCardKey } from './buildHighlights';
import type { ListMarker } from './documentOutlineUtils';
import { buildTextSegments, type TextSegment } from './buildTextSegments';

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
}

const TextSegmentSpan = ({ id, segment, hovered, onSetHoveredMappings }: TextSegmentSpanProps) => {
  const content = (
    <Box
      as="span"
      key={id}
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
  selectedEntryIndex: number | null;
  hoveredMappingKeys: string[];
  onSetHoveredMappingKeys: (keys: string[]) => void;
}

export const BlockRenderer = ({
  segmentId,
  block,
  highlightIndex,
  listMarkers,
  imageById,
  selectedEntryIndex,
  hoveredMappingKeys,
  onSetHoveredMappingKeys,
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

        const imageMappingKeys = visibleHighlights
          .filter((h) => isBlockImageSourceRef(h.sourceRef) && h.sourceRef.imageId === imageId)
          .map((h) => getMappingCardKey(segmentId, h));
        const highlighted = imageMappingKeys.length > 0;
        const hovered = isMappingHovered(imageMappingKeys, hoveredMappingKeys);

        return (
          <Box key={image.id} marginTop="spacingS">
            <Box
              as="img"
              src={image.url}
              alt={image.altText ?? image.title ?? 'Document image'}
              data-highlighted={highlighted ? 'true' : 'false'}
              data-hovered={hovered ? 'true' : 'false'}
              onMouseEnter={
                highlighted ? () => onSetHoveredMappingKeys(imageMappingKeys) : undefined
              }
              onMouseLeave={highlighted ? () => onSetHoveredMappingKeys([]) : undefined}
              style={{
                width: '100%',
                maxHeight: 280,
                objectFit: 'contain',
                borderRadius: tokens.borderRadiusMedium,
                border: `2px solid ${getHighlightStyle(highlighted, hovered).border}`,
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

// ─── TableRenderer ───────────────────────────────────────────────────────────

interface TableRendererProps {
  segmentId: string;
  table: NormalizedDocumentTable;
  highlightIndex: MappingHighlightIndex;
  imageById: Record<string, NormalizedDocumentImage>;
  selectedEntryIndex: number | null;
  hoveredMappingKeys: string[];
  onSetHoveredMappingKeys: (keys: string[]) => void;
}

interface TablePartRendererProps {
  segmentId: string;
  part: NormalizedDocumentTablePart;
  visibleHighlights: MappingHighlight[];
  imageById: Record<string, NormalizedDocumentImage>;
  hoveredMappingKeys: string[];
  onSetHoveredMappingKeys: (keys: string[]) => void;
}

const TablePartRenderer = ({
  segmentId,
  part,
  visibleHighlights,
  imageById,
  hoveredMappingKeys,
  onSetHoveredMappingKeys,
}: TablePartRendererProps) => {
  if (part.type === 'image') {
    const image = imageById[part.imageId];
    if (!image) return null;

    const mappingKeys = visibleHighlights
      .filter((h) => isTableImageSourceRef(h.sourceRef))
      .map((h) => getMappingCardKey(segmentId, h));
    const highlighted = mappingKeys.length > 0;
    const hovered = isMappingHovered(mappingKeys, hoveredMappingKeys);

    return (
      <Box marginTop="spacing2Xs">
        <Box
          as="img"
          src={image.url}
          alt={image.altText ?? image.title ?? 'Table image'}
          data-testid={`table-image-part-${part.id}`}
          onMouseEnter={highlighted ? () => onSetHoveredMappingKeys(mappingKeys) : undefined}
          onMouseLeave={highlighted ? () => onSetHoveredMappingKeys([]) : undefined}
          style={{
            width: '100%',
            maxWidth: 180,
            objectFit: 'contain',
            borderRadius: tokens.borderRadiusMedium,
            border: `2px solid ${getHighlightStyle(highlighted, hovered).border}`,
            backgroundColor: tokens.gray100,
            transition: 'border-color 120ms ease',
          }}
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
  selectedEntryIndex,
  hoveredMappingKeys,
  onSetHoveredMappingKeys,
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
            data-anchor-id={`row:${table.id}:${row.id}`}
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
                          part={part}
                          visibleHighlights={getVisiblePartHighlights(partKey)}
                          imageById={imageById}
                          hoveredMappingKeys={hoveredMappingKeys}
                          onSetHoveredMappingKeys={onSetHoveredMappingKeys}
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
