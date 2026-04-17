import type { EntryToCreate } from './entry';
import type { NormalizedDocumentFlattenedRun } from './normalizedDocument';

export type BlockTextSourceRef = {
  start: number;
  end: number;
  flattenedRuns: NormalizedDocumentFlattenedRun[];
  type: 'blockText';
  blockId: string;
};

export type TableTextSourceRef = {
  type: 'tableText';
  start: number;
  end: number;
  flattenedRuns: NormalizedDocumentFlattenedRun[];
  tableId: string;
  rowId: string;
  cellId: string;
  partId: string;
};

export type TextSourceRef = BlockTextSourceRef | TableTextSourceRef;

/**
 * Block-level text refs after `build-entry-block-graph` / HIL resume (agents-api
 * `indexedEntryBlockGraph`). Assign-from-unmapped must emit these — not `blockText` —
 * or resume Zod validation fails.
 */
export type IndexedParagraphSourceRef = {
  type: 'paragraph';
  blockId: string;
  start: number;
  end: number;
  flattenedRuns: NormalizedDocumentFlattenedRun[];
};

export type IndexedHeadingSourceRef = {
  type: 'heading';
  blockId: string;
  start: number;
  end: number;
  flattenedRuns: NormalizedDocumentFlattenedRun[];
  headingLevel?: number;
};

export type IndexedListItemSourceRef = {
  type: 'listItem';
  blockId: string;
  start: number;
  end: number;
  flattenedRuns: NormalizedDocumentFlattenedRun[];
  bullet?: { nestingLevel: number; ordered: boolean };
};

export type IndexedBlockTextSourceRef =
  | IndexedParagraphSourceRef
  | IndexedHeadingSourceRef
  | IndexedListItemSourceRef;

/** Any source ref that carries a character range + flattened runs (preview or indexed). */
export type TextRangeSourceRef = TextSourceRef | IndexedBlockTextSourceRef;

export type BlockImageSourceRef = {
  blockId: string;
  imageId: string;
  type: 'blockImage';
};

export type TableImageSourceRef = {
  imageId: string;
  type: 'tableImage';
  tableId: string;
  rowId: string;
  cellId: string;
  partId: string;
};

export type ImageSourceRef = BlockImageSourceRef | TableImageSourceRef;

export type SourceRef = TextSourceRef | ImageSourceRef | IndexedBlockTextSourceRef;

export const isTextSourceRef = (sourceRef: SourceRef): sourceRef is TextRangeSourceRef => {
  if (typeof sourceRef !== 'object' || sourceRef === null) return false;
  if (sourceRef.type === 'blockImage' || sourceRef.type === 'tableImage') return false;
  if (!('start' in sourceRef) || !('end' in sourceRef) || !('flattenedRuns' in sourceRef)) {
    return false;
  }
  return Array.isArray((sourceRef as { flattenedRuns: unknown }).flattenedRuns);
};

export const isBlockSourceRef = (
  sourceRef: SourceRef
): sourceRef is BlockTextSourceRef | BlockImageSourceRef | IndexedBlockTextSourceRef => {
  return 'blockId' in sourceRef && !('tableId' in sourceRef);
};

export const isTableSourceRef = (
  sourceRef: SourceRef
): sourceRef is TableTextSourceRef | TableImageSourceRef => {
  return (
    'tableId' in sourceRef && 'rowId' in sourceRef && 'cellId' in sourceRef && 'partId' in sourceRef
  );
};

export const isEntryBlockGraphBlockTextSourceRef = (
  sourceRef: SourceRef
): sourceRef is BlockTextSourceRef | IndexedBlockTextSourceRef => {
  return isBlockSourceRef(sourceRef) && isTextSourceRef(sourceRef) && !('imageId' in sourceRef);
};

export const isTableTextSourceRef = (sourceRef: SourceRef): sourceRef is TableTextSourceRef => {
  return (
    isTableSourceRef(sourceRef) && isTextSourceRef(sourceRef) && sourceRef.type === 'tableText'
  );
};

export const isBlockImageSourceRef = (sourceRef: SourceRef): sourceRef is BlockImageSourceRef => {
  return isBlockSourceRef(sourceRef) && 'imageId' in sourceRef;
};

export const isTableImageSourceRef = (sourceRef: SourceRef): sourceRef is TableImageSourceRef => {
  return isTableSourceRef(sourceRef) && 'imageId' in sourceRef;
};

export interface FieldMapping {
  fieldId: string;
  fieldType: string;
  sourceRefs: SourceRef[];
  sourceEntryIds?: string[];
  confidence: number;
  transformNotes?: string;
}

export interface EntryBlockGraphEntry {
  contentTypeId: string;
  tempId?: string;
  fields?: EntryToCreate['fields'];
  fieldMappings: FieldMapping[];
}

export interface EntryBlockGraph {
  entries: EntryBlockGraphEntry[];
  excludedSourceRefs: SourceRef[];
}
