import type { AssetToCreate, EntryToCreate } from './entry';
import type { EntryBlockGraph } from './entryBlockGraph';
import type { NormalizedDocument } from './normalizedDocument';
import type { ReviewedReferenceGraph as ReferenceGraph } from './workflow';

export interface GoogleDocsPreviewData {
  [key: string]: unknown;
  entries: EntryToCreate[];
  assets: AssetToCreate[];
  referenceGraph?: ReferenceGraph;
  originalNormalizedDocument: NormalizedDocument;
  editableNormalizedDocument: NormalizedDocument;
  entryBlockGraph: EntryBlockGraph;
}
