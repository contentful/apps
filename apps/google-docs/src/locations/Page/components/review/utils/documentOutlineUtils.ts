import type { DocSegment } from '../utils/buildDocument';
import type { EntryBlockGraph, WorkflowContentType } from '@types';

export interface ListMarker {
  marker: string;
  nestingLevel: number;
}

export interface DocumentOutlineOverviewEntry {
  key: string;
  entryIndex: number;
  title: string;
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

const FIELD_TYPE_LABELS: Record<string, string> = {
  Symbol: 'Short text',
  Text: 'Long text',
  RichText: 'Rich text',
  Integer: 'Integer',
  Number: 'Number',
  Date: 'Date & time',
  Boolean: 'Boolean',
  Object: 'JSON object',
  Location: 'Location',
  Link: 'Reference',
  Array: 'List',
  ResourceLink: 'Resource link',
};

export const getFieldTypeLabel = (fieldType: string): string =>
  FIELD_TYPE_LABELS[fieldType] ?? fieldType;

export function buildListMarkers(segments: DocSegment[]): Record<string, ListMarker> {
  const blocks = segments
    .filter((seg): seg is Extract<DocSegment, { kind: 'block' }> => seg.kind === 'block')
    .map((seg) => seg.block);
  const listMarkers: Record<string, ListMarker> = {};
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
        listMarkers[block.id] = {
          marker: `${nextCount}.`,
          nestingLevel,
        };
        return;
      }

      orderedCounts.delete(nestingLevel);
      listMarkers[block.id] = {
        marker: nestingLevel > 0 ? '◦' : '•',
        nestingLevel,
      };
    });

  return listMarkers;
}

// TODO: replace this with the overview section component once it is compatible with entryBlockGraph
export function buildOverviewEntries(
  entries: EntryBlockGraph['entries'],
  contentTypes: WorkflowContentType[]
): DocumentOutlineOverviewEntry[] {
  return entries.map((graphEntry, entryIndex) => {
    const contentTypeName = contentTypes.find(
      (contentType) => contentType.sys.id === graphEntry.contentTypeId
    )?.name;
    const displayName = contentTypeName ?? 'Untitled';

    return {
      key: graphEntry.tempId ?? `${graphEntry.contentTypeId}-${entryIndex}`,
      entryIndex,
      title: displayName,
    };
  });
}
