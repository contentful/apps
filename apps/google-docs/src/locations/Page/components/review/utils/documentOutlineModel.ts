import type {
  EntryBlockGraph,
  EntryBlockGraphSourceRef,
  NormalizedDocumentContentBlock,
  WorkflowContentType,
} from '@types';
import { isBlockSourceRef } from '@types';

export interface SourceUsage {
  entryIndex: number;
  fieldType: string;
  fieldId: string;
  sourceRef: EntryBlockGraphSourceRef;
}

export interface ListItemPresentation {
  marker: string;
  nestingLevel: number;
}

export interface DocumentOutlineOverviewEntry {
  key: string;
  entryIndex: number;
  title: string;
  contentType: string;
}

export interface SourceUsageIndex {
  blockUsage: Record<string, SourceUsage[]>;
  tablePartUsage: Record<string, SourceUsage[]>;
  tableUsage: Record<string, SourceUsage[]>;
}

export const formatDisplayName = (value: string): string => {
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

export function buildUsageIndexes(entryBlockGraph: EntryBlockGraph): SourceUsageIndex {
  const blockUsage: Record<string, SourceUsage[]> = {};
  const tablePartUsage: Record<string, SourceUsage[]> = {};
  const tableUsage: Record<string, SourceUsage[]> = {};

  entryBlockGraph.entries.forEach((mappingEntry, entryIndex) => {
    mappingEntry.fieldMappings.forEach((fieldMapping) => {
      fieldMapping.sourceRefs.forEach((sourceRef) => {
        const usage: SourceUsage = {
          entryIndex,
          fieldId: fieldMapping.fieldId,
          fieldType: fieldMapping.fieldType,
          sourceRef,
        };

        if (isBlockSourceRef(sourceRef)) {
          blockUsage[sourceRef.blockId] = [...(blockUsage[sourceRef.blockId] ?? []), usage];
          return;
        }

        if (
          !(
            'tableId' in sourceRef &&
            'rowId' in sourceRef &&
            'cellId' in sourceRef &&
            'partId' in sourceRef
          )
        ) {
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

export const getMappingCardKey = (segmentId: string, usage: SourceUsage): string =>
  `${segmentId}-${usage.entryIndex}-${usage.fieldId}`;

export function uniqueUsage<T extends SourceUsage>(usage: T[]): T[] {
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

export function buildListItemPresentations(
  blocks: NormalizedDocumentContentBlock[]
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

export function buildOverviewEntries(
  entries: EntryBlockGraph['entries'],
  contentTypes: WorkflowContentType[]
): DocumentOutlineOverviewEntry[] {
  return entries.map((graphEntry, entryIndex) => {
    const contentTypeName = contentTypes.find(
      (contentType) => contentType.sys.id === graphEntry.contentTypeId
    )?.name;
    const displayName = formatDisplayName(contentTypeName ?? graphEntry.contentTypeId);

    return {
      key: graphEntry.tempId ?? `${graphEntry.contentTypeId}-${entryIndex}`,
      entryIndex,
      title: displayName,
      contentType: displayName,
      mappingCount: graphEntry.fieldMappings.length,
    };
  });
}
