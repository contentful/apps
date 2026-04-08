import type { AssetToCreate, EntryToCreate } from './entry';

export enum RunStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  DRAFT = 'DRAFT',
}

export interface AgentRunMessage {
  role: string;
  content?: {
    parts?: Array<{
      type: string;
      text?: string;
    }>;
  };
}

export interface DocTabOption {
  id: string;
  title: string;
  index?: number;
}

export interface DocumentTabProps {
  tabId: string;
  tabTitle: string;
}

export interface NormalizedDocumentTextRun {
  text: string;
  styles?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    superscript?: boolean;
    subscript?: boolean;
    linkUrl?: string;
  };
}

export interface NormalizedDocumentFlattenedRun extends NormalizedDocumentTextRun {
  start: number;
  end: number;
}

export interface NormalizedDocumentContentBlock {
  id: string;
  position: number;
  type: 'paragraph' | 'heading' | 'listItem' | 'image';
  headingLevel?: number;
  bullet?: {
    nestingLevel: number;
    ordered: boolean;
  };
  textRuns: NormalizedDocumentTextRun[];
  flattenedTextRuns?: NormalizedDocumentFlattenedRun[];
  designValueIds: string[];
  imageIds: string[];
  captionForImageId?: string;
}

export interface NormalizedDocumentTableTextPart {
  id: string;
  type: 'text';
  textRuns: NormalizedDocumentTextRun[];
  flattenedTextRuns?: NormalizedDocumentFlattenedRun[];
}

export interface NormalizedDocumentTableImagePart {
  id: string;
  type: 'image';
  imageId: string;
}

export type NormalizedDocumentTablePart =
  | NormalizedDocumentTableTextPart
  | NormalizedDocumentTableImagePart;

export interface NormalizedDocumentTableCell {
  id: string;
  parts: NormalizedDocumentTablePart[];
}

export interface NormalizedDocumentTableRow {
  id: string;
  cells: NormalizedDocumentTableCell[];
}

export interface NormalizedDocumentTable {
  id: string;
  position: number;
  headers: string[];
  rows: NormalizedDocumentTableRow[];
  designValueIds: string[];
  imageIds: string[];
}

export interface NormalizedDocumentDesignValue {
  id: string;
  type: string;
  value: Record<string, unknown>;
  appliesTo: string[];
}

export interface NormalizedDocumentImage {
  id: string;
  url: string;
  altText?: string;
  title?: string;
  fileName?: string;
  contentType?: string;
  width?: number;
  height?: number;
  blockId?: string;
  tableId?: string;
}

export interface NormalizedDocumentAsset {
  url: string;
  altText?: string;
  title?: string;
  fileName?: string;
  contentType?: string;
}

export interface NormalizedDocument {
  documentId: string;
  title?: string;
  designValues?: NormalizedDocumentDesignValue[];
  contentBlocks: NormalizedDocumentContentBlock[];
  images?: NormalizedDocumentImage[];
  tables: NormalizedDocumentTable[];
  assets?: NormalizedDocumentAsset[];
}

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

export interface ReviewedReferenceGraphEdge {
  from: string;
  to: string;
  fieldId: string;
}

export interface ReviewedReferenceGraphDeferredField {
  entryId?: string;
  tempId?: string;
  fieldId: string;
  reason?: string;
}

export interface ReviewedReferenceGraph {
  edges?: ReviewedReferenceGraphEdge[];
  creationOrder?: string[];
  deferredFields?: ReviewedReferenceGraphDeferredField[];
  hasCircularDependency?: boolean;
}

export interface WorkflowContentTypeField {
  id?: string;
  name?: string;
  type?: string;
  required?: boolean;
  validations?: unknown[];
}

export interface WorkflowContentType {
  sys: {
    id: string;
  };
  displayField?: string;
  name?: string;
  description?: string | null;
  fields: WorkflowContentTypeField[];
}

export interface PreviewPayload {
  entries: EntryToCreate[];
  assets: AssetToCreate[];
  referenceGraph: ReviewedReferenceGraph;
  normalizedDocument: NormalizedDocument;
  entryBlockGraph?: EntryBlockGraph;
}

export interface DocumentScopeSuspendPayload {
  suspendStepId: 'document-scope-selection';
  reason?: string;
  documentId?: string;
  title?: string;
  requiresImageSelection?: boolean;
  requiresTabSelection?: boolean;
  imageCount?: number;
  inlineObjectCount?: number;
  positionedObjectCount?: number;
  tabCount?: number;
  tabs?: DocTabOption[];
}

export interface MappingReviewSuspendPayload {
  suspendStepId: 'mapping-review';
  reason: string;
  documentId: string;
  documentTitle?: string;
  normalizedDocument: NormalizedDocument;
  entryBlockGraph: EntryBlockGraph;
  referenceGraph: ReviewedReferenceGraph;
  contentTypes: WorkflowContentType[];
}

export type SuspendPayload = DocumentScopeSuspendPayload | MappingReviewSuspendPayload;

export type WorkflowRunResult =
  | {
      status: RunStatus.PENDING_REVIEW;
      runId: string;
      messages: AgentRunMessage[];
      suspendPayload: SuspendPayload;
    }
  | {
      status: RunStatus.COMPLETED;
      runId: string;
      messages: AgentRunMessage[];
      googleDocPayload: PreviewPayload;
    };

export interface ResumePayload {
  includeImages?: boolean;
  selectedTabIds?: string[];
  editedNormalizedDocument?: NormalizedDocument;
  entryBlockGraph?: EntryBlockGraph;
}
