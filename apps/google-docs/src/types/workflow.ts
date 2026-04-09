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
  };
}

export interface NormalizedDocumentContentBlock {
  id: string;
  position: number;
  type: 'paragraph' | 'heading' | 'listItem';
  headingLevel?: number;
  textRuns: NormalizedDocumentTextRun[];
  designValueIds: string[];
  imageIds: string[];
  bullet?: {
    nestingLevel: number;
    ordered: boolean;
  };
  captionForImageId?: string;
}

export interface NormalizedDocumentTableRow {
  cells: string[];
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

export interface ReviewedReferenceGraphEdge {
  from: string;
  to: string;
  fieldId: string;
}

export interface ReviewedReferenceGraphDeferredField {
  entryId: string;
  fieldId: string;
  reason: string;
}

export interface ReviewedReferenceGraph {
  edges?: ReviewedReferenceGraphEdge[];
  creationOrder?: string[];
  deferredFields?: ReviewedReferenceGraphDeferredField[];
  hasCircularDependency?: boolean;
}

export interface PreviewPayload {
  entries: EntryToCreate[];
  assets: AssetToCreate[];
  referenceGraph: ReviewedReferenceGraph;
  normalizedDocument: NormalizedDocument;
}

export interface MappingReviewEntryBlock {
  [key: string]: unknown;
}

export interface MappingReviewContentType {
  [key: string]: unknown;
}

export interface TabsImagesSuspendPayload {
  reason?: string;
  suspendStepId: 'select-tabs-images-step';
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
  reason?: string;
  suspendStepId: 'mapping-review';
  documentId: string;
  documentTitle?: string;
  normalizedDocument: NormalizedDocument;
  entryBlockGraph: MappingReviewEntryBlock[];
  referenceGraph: ReviewedReferenceGraph;
  contentTypes: MappingReviewContentType[];
}

export type WorkflowRunResult =
  | {
      status: RunStatus.PENDING_REVIEW;
      runId: string;
      messages: AgentRunMessage[];
      suspendPayload: TabsImagesSuspendPayload | MappingReviewSuspendPayload;
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
  entryBlockGraph?: MappingReviewEntryBlock[];
}
