import type {
  AssetToCreate,
  EntryToCreate,
} from '../../functions/agents/documentParserAgent/schema';
// This file contains the types for the document scope review state, resume payload, and workflow run result.

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

export interface PreviewPayload {
  entries: EntryToCreate[];
  assets: AssetToCreate[];
  referenceGraph: ReviewedReferenceGraph;
  normalizedDocument: Record<string, unknown>;
}

export interface ReviewedReferenceGraph {
  edges?: unknown[];
  creationOrder?: string[];
  deferredFields?: unknown[];
  hasCircularDependency?: boolean;
}

export interface DocumentScopeSuspendPayload {
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

export type WorkflowRunResult =
  | {
      status: RunStatus.PENDING_REVIEW;
      runId: string;
      messages: AgentRunMessage[];
      suspendPayload: DocumentScopeSuspendPayload;
    }
  | {
      status: RunStatus.COMPLETED;
      runId: string;
      messages: AgentRunMessage[];
      googleDocPayload: PreviewPayload;
    };

export interface DocumentScopeResumePayload {
  includeImages?: boolean;
  selectedTabIds?: string[];
}
