// This file contains the types for the document scope review state, resume payload, and workflow run result.

import type {
  AssetToCreate,
  EntryToCreate,
} from '../../functions/agents/documentParserAgent/schema';

export interface DocumentTabProps {
  tabId: string;
  tabTitle: string;
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
  id?: string;
  title?: string;
  index?: number;
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

export interface ReviewedReferenceGraph {
  edges?: unknown[];
  creationOrder?: string[];
  deferredFields?: unknown[];
  hasCircularDependency?: boolean;
}

export interface ReviewedCreationPayload {
  entries: EntryToCreate[];
  assets: AssetToCreate[];
  referenceGraph?: ReviewedReferenceGraph;
}

export type WorkflowRunResult =
  | {
      status: 'PENDING_REVIEW';
      runId: string;
      messages: AgentRunMessage[];
      suspendPayload: DocumentScopeSuspendPayload;
    }
  | {
      status: 'COMPLETED';
      runId: string;
      messages: AgentRunMessage[];
      reviewedPayload: ReviewedCreationPayload;
    };

export interface DocumentScopeResumePayload {
  includeImages?: boolean;
  selectedTabIds?: string[];
}

export interface DocumentScopeReviewState {
  availableTabs: DocumentTabProps[];
  selectedTabs: DocumentTabProps[];
  useAllTabs: boolean | null;
  includeImages: boolean | null;
  requiresImageSelection: boolean;
}

export const initialDocumentScopeReviewState: DocumentScopeReviewState = {
  availableTabs: [],
  selectedTabs: [],
  useAllTabs: null,
  includeImages: null,
  requiresImageSelection: false,
};
