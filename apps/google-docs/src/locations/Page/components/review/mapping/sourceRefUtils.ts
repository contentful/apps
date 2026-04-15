import type {
  BlockTextSourceRef,
  ImageSourceRef,
  SourceRef,
  TableTextSourceRef,
  TextSourceRef,
} from '@types';
import { isBlockImageSourceRef, isTableImageSourceRef, isTableSourceRef } from '@types';

const BLOCK_TEXT_TYPES = new Set(['blockText', 'paragraph', 'heading']);
const TABLE_TEXT_TYPES = new Set(['tableText', 'tableCell', 'tableParagraph']);

function isBlockTextRef(ref: TextSourceRef): ref is BlockTextSourceRef {
  return BLOCK_TEXT_TYPES.has(ref.type);
}

function isTableTextRef(ref: TextSourceRef): ref is TableTextSourceRef {
  return TABLE_TEXT_TYPES.has(ref.type);
}

function toFiniteNumber(value: unknown): number | null {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}

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

function areTextContainersEqual(a: TextSourceRef, b: TextSourceRef): boolean {
  if (isTableTextRef(a) && isTableTextRef(b)) {
    return (
      a.tableId === b.tableId &&
      a.rowId === b.rowId &&
      a.cellId === b.cellId &&
      a.partId === b.partId
    );
  }

  if (isBlockTextRef(a) && isBlockTextRef(b)) {
    return a.blockId === b.blockId;
  }

  return false;
}

/**
 * Runtime payloads may carry numeric-like strings for offsets and may omit `flattenedRuns`.
 * This normalizes text refs so overlap checks still work for partial selections.
 */
function normalizeTextRangeRef(ref: SourceRef): TextSourceRef | null {
  if (isTableTextRangeLike(ref)) {
    const start = toFiniteNumber(ref.start);
    const end = toFiniteNumber(ref.end);
    if (start === null || end === null) return null;

    return {
      type: 'tableText',
      tableId: ref.tableId,
      rowId: ref.rowId,
      cellId: ref.cellId,
      partId: ref.partId,
      start,
      end,
      flattenedRuns: ref.flattenedRuns ?? [],
    };
  }

  if (isBlockTextRangeLike(ref)) {
    const start = toFiniteNumber(ref.start);
    const end = toFiniteNumber(ref.end);
    if (start === null || end === null) return null;

    return {
      type: 'blockText',
      blockId: ref.blockId,
      start,
      end,
      flattenedRuns: ref.flattenedRuns ?? [],
    };
  }

  return null;
}

export function sourceRefsOverlap(candidate: SourceRef, selected: SourceRef): boolean {
  const normalizedCandidate = normalizeTextRangeRef(candidate);
  const normalizedSelected = normalizeTextRangeRef(selected);
  if (normalizedCandidate && normalizedSelected) {
    return (
      areTextContainersEqual(normalizedCandidate, normalizedSelected) &&
      normalizedCandidate.start < normalizedSelected.end &&
      normalizedSelected.start < normalizedCandidate.end
    );
  }

  return buildSourceRefKey(candidate) === buildSourceRefKey(selected);
}

export function isImageSourceRefExcluded(ref: ImageSourceRef, excluded: SourceRef[]): boolean {
  const targetKey = buildSourceRefKey(ref);
  return excluded.some((candidate) => buildSourceRefKey(candidate) === targetKey);
}
