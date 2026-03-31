// This file contains the types for the document scope review state, resume payload, and workflow run result.

export enum RunStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  DRAFT = 'DRAFT',
}

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

export interface PreviewPayload {
  documentTitle: string;
  data: Record<string, unknown>;
}

export interface DocTabOption {
  id: string;
  title: string;
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
  status: RunStatus.PENDING_REVIEW | RunStatus.COMPLETED;
  runId: string;
  messages: AgentRunMessage[];
  suspendPayload?: DocumentScopeSuspendPayload;
  payload?: PreviewPayload;
}

export interface DocumentScopeResumePayload {
  includeImages?: boolean;
  selectedTabIds?: string[];
}
