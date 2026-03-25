// This file contains the types for the document scope review state, resume payload, and workflow run result.

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

export interface WorkflowRunResult {
  status: 'PENDING_REVIEW' | 'COMPLETED';
  runId: string;
  messages: AgentRunMessage[];
  suspendPayload?: DocumentScopeSuspendPayload;
}

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
