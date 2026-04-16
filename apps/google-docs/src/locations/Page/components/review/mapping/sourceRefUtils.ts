import type { BlockTextSourceRef, ImageSourceRef, SourceRef, TableTextSourceRef } from '@types';
import { isBlockImageSourceRef, isTableImageSourceRef, isTableSourceRef } from '@types';

/**
 * Block-level text (blockText / paragraph / heading from graph, or UI blockText) with a range.
 * Does not require `flattenedRuns` (graph may omit it).
 */
function isBlockTextRangeLike(ref: SourceRef): ref is BlockTextSourceRef {
  if (isBlockImageSourceRef(ref) || isTableSourceRef(ref)) return false;
  return 'blockId' in ref && 'start' in ref && 'end' in ref;
}

/**
 * Table cell text with a range; `type` may be `tableText`, `tableCell`, `tableParagraph`, etc.
 * Does not require `flattenedRuns` (graph may omit it).
 */
function isTableTextRangeLike(ref: SourceRef): ref is TableTextSourceRef {
  if (!isTableSourceRef(ref) || isTableImageSourceRef(ref)) return false;
  return 'start' in ref && 'end' in ref;
}

export function buildSourceRefKey(sourceRef: SourceRef): string {
  if (isBlockImageSourceRef(sourceRef)) {
    return `blockImage:${sourceRef.blockId}:${sourceRef.imageId}`;
  }

  if (isTableImageSourceRef(sourceRef)) {
    return `tableImage:${sourceRef.tableId}:${sourceRef.rowId}:${sourceRef.cellId}:${sourceRef.partId}:${sourceRef.imageId}`;
  }

  if (isBlockTextRangeLike(sourceRef)) {
    return `blockText:${sourceRef.blockId}:${sourceRef.start}:${sourceRef.end}`;
  }

  if (isTableTextRangeLike(sourceRef)) {
    return `tableText:${sourceRef.tableId}:${sourceRef.rowId}:${sourceRef.cellId}:${sourceRef.partId}:${sourceRef.start}:${sourceRef.end}`;
  }

  return '';
}

export function isImageSourceRefExcluded(ref: ImageSourceRef, excluded: SourceRef[]): boolean {
  const targetKey = buildSourceRefKey(ref);
  return excluded.some((candidate) => buildSourceRefKey(candidate) === targetKey);
}
