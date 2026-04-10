import type { NormalizedDocumentFlattenedRun } from './normalizedDocument';

export type EntryBlockGraphTextSourceRef =
  | {
      kind: 'blockText';
      blockId: string;
      start: number;
      end: number;
      flattenedRuns?: NormalizedDocumentFlattenedRun[];
    }
  | {
      kind: 'tableText';
      tableId: string;
      rowId: string;
      cellId: string;
      partId: string;
      start: number;
      end: number;
      flattenedRuns?: NormalizedDocumentFlattenedRun[];
    };

export type EntryBlockGraphImageSourceRef =
  | {
      kind: 'blockImage';
      blockId: string;
      imageId: string;
    }
  | {
      kind: 'tableImage';
      tableId: string;
      rowId: string;
      cellId: string;
      partId: string;
      imageId: string;
    };

export type EntryBlockGraphSourceRef = EntryBlockGraphTextSourceRef | EntryBlockGraphImageSourceRef;

export interface EntryBlockGraphFieldMapping {
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
  fieldMappings: EntryBlockGraphFieldMapping[];
}

export interface EntryBlockGraph {
  entries: EntryBlockGraphEntry[];
  excludedSourceRefs: EntryBlockGraphSourceRef[];
}
