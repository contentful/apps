import type { DocSegment } from './buildDocument';

export interface ListMarker {
  marker: string;
  nestingLevel: number;
}

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
