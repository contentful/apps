import type { NormalizedDocumentFlattenedRun } from './normalizedDocument';

interface TextSourceRefBase {
  start: number;
  end: number;
  flattenedRuns: NormalizedDocumentFlattenedRun[];
  kind?: 'blockText' | 'tableText';
  type?: string;
}

interface ImageSourceRefBase {
  imageId: string;
  kind?: 'blockImage' | 'tableImage';
  type?: string;
}

export type BlockTextSourceRef = TextSourceRefBase & {
  blockId: string;
};

export type TableTextSourceRef = TextSourceRefBase & {
  tableId: string;
  rowId: string;
  cellId: string;
  partId: string;
};

export type isTextSourceRef = BlockTextSourceRef | TableTextSourceRef;

export type BlockImageSourceRef = ImageSourceRefBase & {
  blockId: string;
};

export type TableImageSourceRef = ImageSourceRefBase & {
  tableId: string;
  rowId: string;
  cellId: string;
  partId: string;
};

export type ImageSourceRef = BlockImageSourceRef | TableImageSourceRef;

export type EntryBlockGraphSourceRef = isTextSourceRef | ImageSourceRef;

export const isTextSourceRef = (
  sourceRef: EntryBlockGraphSourceRef
): sourceRef is isTextSourceRef => {
  return 'start' in sourceRef && 'end' in sourceRef && 'flattenedRuns' in sourceRef;
};

export const isBlockSourceRef = (
  sourceRef: EntryBlockGraphSourceRef
): sourceRef is BlockTextSourceRef | BlockImageSourceRef => {
  return 'blockId' in sourceRef;
};

export const isTableSourceRef = (
  sourceRef: EntryBlockGraphSourceRef
): sourceRef is TableTextSourceRef | TableImageSourceRef => {
  return (
    'tableId' in sourceRef && 'rowId' in sourceRef && 'cellId' in sourceRef && 'partId' in sourceRef
  );
};

export const isEntryBlockGraphBlockTextSourceRef = (
  sourceRef: EntryBlockGraphSourceRef
): sourceRef is BlockTextSourceRef => {
  return isBlockSourceRef(sourceRef) && isTextSourceRef(sourceRef);
};

export const isTableTextSourceRef = (
  sourceRef: EntryBlockGraphSourceRef
): sourceRef is TableTextSourceRef => {
  return isTableSourceRef(sourceRef) && isTextSourceRef(sourceRef);
};

export const isBlockImageSourceRef = (
  sourceRef: EntryBlockGraphSourceRef
): sourceRef is BlockImageSourceRef => {
  return isBlockSourceRef(sourceRef) && 'imageId' in sourceRef;
};

export const isTableImageSourceRef = (
  sourceRef: EntryBlockGraphSourceRef
): sourceRef is TableImageSourceRef => {
  return isTableSourceRef(sourceRef) && 'imageId' in sourceRef;
};

export interface FieldMapping {
  fieldId: string;
  fieldType: string;
  sourceRefs: EntryBlockGraphSourceRef[];
  sourceEntryIds?: string[];
  confidence: number;
  transformNotes?: string;
}

export interface EntryBlockGraphEntry {
  contentTypeId: string;
  tempId?: string;
  fieldMappings: FieldMapping[];
}

export interface EntryBlockGraph {
  entries: EntryBlockGraphEntry[];
  excludedSourceRefs: EntryBlockGraphSourceRef[];
}
