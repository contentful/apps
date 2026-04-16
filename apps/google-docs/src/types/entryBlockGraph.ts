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

export type SourceRef = TextSourceRef | ImageSourceRef;

export const isTextSourceRef = (sourceRef: SourceRef): sourceRef is TextSourceRef => {
  return 'start' in sourceRef && 'end' in sourceRef && 'flattenedRuns' in sourceRef;
};

export const isBlockSourceRef = (
  sourceRef: SourceRef
): sourceRef is BlockTextSourceRef | BlockImageSourceRef => {
  return 'blockId' in sourceRef;
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
): sourceRef is BlockTextSourceRef => {
  return isBlockSourceRef(sourceRef) && isTextSourceRef(sourceRef);
};

export const isTableTextSourceRef = (sourceRef: SourceRef): sourceRef is TableTextSourceRef => {
  return isTableSourceRef(sourceRef) && isTextSourceRef(sourceRef);
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
