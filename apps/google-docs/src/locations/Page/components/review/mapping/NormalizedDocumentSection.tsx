import { Box } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import type { ImageSourceRef, NormalizedDocumentImage, SourceRef } from '@types';
import type { MappingHighlightIndex } from './buildHighlights';
import type { ListMarker } from './buildListMarkers';
import type { DocSegment } from './buildDocument';
import { BlockRenderer, TableRenderer } from './documentRenderers';

interface ReviewDocumentBodyProps {
  segment: DocSegment;
  highlightIndex: MappingHighlightIndex;
  imageById: Record<string, NormalizedDocumentImage>;
  listMarkers: Record<string, ListMarker>;
  excludedSourceRefs: SourceRef[];
  selectedEntryIndex: number | null;
  hoveredMappingKeys: string[];
  onSetHoveredMappingKeys: (keys: string[]) => void;
  onEditImage: (sourceRef: ImageSourceRef, label: string) => void;
}

export const NormalizedDocumentSection = ({
  segment,
  highlightIndex,
  imageById,
  listMarkers,
  excludedSourceRefs,
  selectedEntryIndex,
  hoveredMappingKeys,
  onSetHoveredMappingKeys,
  onEditImage,
}: ReviewDocumentBodyProps): JSX.Element => {
  return (
    <Box style={{ flex: 2 }}>
      <Box data-review-segment-surface="true" data-testid={`segment-surface-${segment.id}`}>
        <Box
          id={segment.kind === 'block' ? `block:${segment.block.id}` : undefined}
          data-testid={segment.kind === 'block' ? `block-anchor-${segment.block.id}` : undefined}
          style={{
            padding: tokens.spacingXs,
          }}>
          {segment.kind === 'table' ? (
            <TableRenderer
              segmentId={segment.id}
              table={segment.table}
              highlightIndex={highlightIndex}
              imageById={imageById}
              excludedSourceRefs={excludedSourceRefs}
              selectedEntryIndex={selectedEntryIndex}
              hoveredMappingKeys={hoveredMappingKeys}
              onSetHoveredMappingKeys={onSetHoveredMappingKeys}
              onEditImage={onEditImage}
            />
          ) : (
            <BlockRenderer
              segmentId={segment.id}
              block={segment.block}
              highlightIndex={highlightIndex}
              listMarkers={listMarkers}
              imageById={imageById}
              excludedSourceRefs={excludedSourceRefs}
              selectedEntryIndex={selectedEntryIndex}
              hoveredMappingKeys={hoveredMappingKeys}
              onSetHoveredMappingKeys={onSetHoveredMappingKeys}
              onEditImage={onEditImage}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};
