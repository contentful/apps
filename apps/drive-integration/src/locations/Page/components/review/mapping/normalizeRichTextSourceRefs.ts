import type {
  NormalizedDocument,
  NormalizedDocumentContentBlock,
  SourceRef,
  TextRangeSourceRef,
} from '@types';
import {
  isBlockImageSourceRef,
  isTableImageSourceRef,
  isTableTextSourceRef,
  isTextSourceRef,
} from '@types';
import { buildSourceRefKey } from './sourceRefUtils';

function cloneTextRangeSourceRef(ref: TextRangeSourceRef): TextRangeSourceRef {
  return {
    ...ref,
    flattenedRuns: ref.flattenedRuns.map((run) => ({ ...run })),
  };
}

function cloneSourceRef(ref: SourceRef): SourceRef {
  if (isTextSourceRef(ref)) {
    return cloneTextRangeSourceRef(ref);
  }

  return { ...ref };
}

function buildDocumentOrderLookup(document: NormalizedDocument): Map<string, number> {
  const orderLookup = new Map<string, number>();
  let nextOrder = 0;

  const blocks = document.contentBlocks
    .filter((block): block is NormalizedDocumentContentBlock => block.type !== 'tab')
    .map((block) => ({ kind: 'block' as const, position: block.position, block }));
  const tables = document.tables.map((table) => ({
    kind: 'table' as const,
    position: table.position,
    table,
  }));
  const positionedItems = [...blocks, ...tables].sort(
    (left, right) => left.position - right.position
  );

  positionedItems.forEach((item) => {
    if (item.kind === 'block') {
      if (item.block.flattenedTextRuns.length > 0) {
        orderLookup.set(`block:${item.block.id}:text`, nextOrder++);
      }

      item.block.imageIds.forEach((imageId, imageIndex) => {
        orderLookup.set(`block:${item.block.id}:image:${imageId}`, nextOrder + imageIndex);
      });
      nextOrder += item.block.imageIds.length;
      return;
    }

    item.table.rows.forEach((row) => {
      row.cells.forEach((cell) => {
        cell.parts.forEach((part) => {
          orderLookup.set(
            `table:${item.table.id}:${row.id}:${cell.id}:${part.id}:part`,
            nextOrder++
          );
        });
      });
    });
  });

  return orderLookup;
}

function getSourceRefOrder(sourceRef: SourceRef, orderLookup: Map<string, number>): number {
  if (isBlockImageSourceRef(sourceRef)) {
    return (
      orderLookup.get(`block:${sourceRef.blockId}:image:${sourceRef.imageId}`) ??
      Number.MAX_SAFE_INTEGER
    );
  }

  if (isTableImageSourceRef(sourceRef) || isTableTextSourceRef(sourceRef)) {
    return (
      orderLookup.get(
        `table:${sourceRef.tableId}:${sourceRef.rowId}:${sourceRef.cellId}:${sourceRef.partId}:part`
      ) ?? Number.MAX_SAFE_INTEGER
    );
  }

  if ('blockId' in sourceRef) {
    return orderLookup.get(`block:${sourceRef.blockId}:text`) ?? Number.MAX_SAFE_INTEGER;
  }

  return Number.MAX_SAFE_INTEGER;
}

function dedupeSourceRefs(sourceRefs: SourceRef[]): SourceRef[] {
  const byKey = new Map<string, SourceRef>();

  sourceRefs.forEach((sourceRef) => {
    const key = buildSourceRefKey(sourceRef);
    if (!key || byKey.has(key)) return;
    byKey.set(key, cloneSourceRef(sourceRef));
  });

  return Array.from(byKey.values());
}

export function normalizeRichTextSourceRefs(
  document: NormalizedDocument,
  sourceRefs: SourceRef[]
): SourceRef[] {
  const orderLookup = buildDocumentOrderLookup(document);

  return dedupeSourceRefs(sourceRefs).sort((left, right) => {
    const orderDiff = getSourceRefOrder(left, orderLookup) - getSourceRefOrder(right, orderLookup);
    if (orderDiff !== 0) return orderDiff;

    if (isTextSourceRef(left) && isTextSourceRef(right)) {
      return left.start - right.start;
    }

    return buildSourceRefKey(left).localeCompare(buildSourceRefKey(right));
  });
}
