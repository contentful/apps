import type { AssetToCreate, EntryToCreate } from './entry';
import type { EntryBlockGraph } from './entryBlockGraph';
import type { NormalizedDocument } from './normalizedDocument';

export enum RunStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  DRAFT = 'DRAFT',
}

export enum WorkflowFailureReason {
  GENERIC = 'generic',
  GOOGLE_DRIVE_AUTH_EXPIRED = 'google-drive-auth-expired',
}

export interface WorkflowFailure {
  code: WorkflowFailureReason;
  message: string;
  httpStatus?: number;
}

export class WorkflowRunError extends Error {
  reason: WorkflowFailureReason;

  constructor(message: string, reason: WorkflowFailureReason = WorkflowFailureReason.GENERIC) {
    super(message);
    this.name = 'WorkflowRunError';
    this.reason = reason;
  }
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
  linkType?: string;
  fieldControl?: {
    widgetId?: string;
  };
  items?: {
    type?: string;
    linkType?: string;
    validations?: unknown[];
  };
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

export interface CompletedWorkflowPayload {
  entries: EntryToCreate[];
  assets: AssetToCreate[];
  referenceGraph: ReviewedReferenceGraph;
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
  entryBlockGraph: EntryBlockGraph;
  referenceGraph: ReviewedReferenceGraph;
  contentTypes: WorkflowContentType[];
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
      googleDocPayload: CompletedWorkflowPayload;
    };

export interface ResumePayload {
  includeImages?: boolean;
  selectedTabIds?: string[];
  editedNormalizedDocument?: NormalizedDocument;
  entryBlockGraph?: EntryBlockGraph;
  cancelled?: true;
}
