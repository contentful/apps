import type { EntryBlockGraph, SourceRef } from '@types';
import { isBlockSourceRef, isTableSourceRef } from '@types';

export interface MappingHighlight {
  entryIndex: number;
  fieldType: string;
  fieldId: string;
  sourceRef: SourceRef;
}

export interface MappingHighlightIndex {
  blockHighlights: Record<string, MappingHighlight[]>;
  tablePartHighlights: Record<string, MappingHighlight[]>;
  tableHighlights: Record<string, MappingHighlight[]>;
}

export function buildMappingHighlightIndex(
  entryBlockGraph: EntryBlockGraph
): MappingHighlightIndex {
  const blockHighlights: Record<string, MappingHighlight[]> = {};
  const tablePartHighlights: Record<string, MappingHighlight[]> = {};
  const tableHighlights: Record<string, MappingHighlight[]> = {};

  entryBlockGraph.entries.forEach((mappingEntry, entryIndex) => {
    mappingEntry.fieldMappings.forEach((fieldMapping) => {
      fieldMapping.sourceRefs.forEach((sourceRef) => {
        const highlight: MappingHighlight = {
          entryIndex,
          fieldId: fieldMapping.fieldId,
          fieldType: fieldMapping.fieldType,
          sourceRef,
        };

        if (isBlockSourceRef(sourceRef)) {
          blockHighlights[sourceRef.blockId] = [
            ...(blockHighlights[sourceRef.blockId] ?? []),
            highlight,
          ];
          return;
        }

        if (isTableSourceRef(sourceRef)) {
          const tablePartKey = [
            sourceRef.tableId,
            sourceRef.rowId,
            sourceRef.cellId,
            sourceRef.partId,
          ].join(':');

          tablePartHighlights[tablePartKey] = [
            ...(tablePartHighlights[tablePartKey] ?? []),
            highlight,
          ];
          tableHighlights[sourceRef.tableId] = [
            ...(tableHighlights[sourceRef.tableId] ?? []),
            highlight,
          ];
        }
      });
    });
  });

  return { blockHighlights, tablePartHighlights, tableHighlights };
}

export const getMappingCardKey = (segmentId: string, highlight: MappingHighlight): string =>
  `${segmentId}-${highlight.entryIndex}-${highlight.fieldId}`;

export function uniqueHighlights<T extends MappingHighlight>(highlights: T[]): T[] {
  const seen = new Set<string>();

  return highlights.filter((item) => {
    const key = `${item.entryIndex}-${item.fieldId}-${item.fieldType}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
