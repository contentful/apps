import type { EntryBlockGraph, SourceRef } from '@types';
import { isBlockSourceRef, isTableSourceRef } from '@types';
import { buildSourceRefKey } from './sourceRefUtils';

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

/**
 * Stable id for a mapping card / DOM segment. Includes the source ref so the same
 * field can map multiple disjoint ranges (e.g. after text exclusions split a ref).
 */
export const getMappingCardKey = (segmentId: string, highlight: MappingHighlight): string => {
  const refKey = buildSourceRefKey(highlight.sourceRef);
  return refKey
    ? `${segmentId}-${highlight.entryIndex}-${highlight.fieldId}:${refKey}`
    : `${segmentId}-${highlight.entryIndex}-${highlight.fieldId}`;
};

export function uniqueHighlights<T extends MappingHighlight>(highlights: T[]): T[] {
  const seen = new Set<string>();

  return highlights.filter((item) => {
    const refKey = buildSourceRefKey(item.sourceRef);
    // Scope by entry + field: different fields can legally share the same block/range
    // (e.g. page.pageName vs blogPost.internalLabel on block-4). Dedupe only true duplicates.
    const dedupeKey = `${item.entryIndex}|${item.fieldId}|${refKey || item.fieldType}`;
    if (seen.has(dedupeKey)) {
      return false;
    }

    seen.add(dedupeKey);
    return true;
  });
}
