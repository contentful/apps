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

export interface PreviewPayload {
  documentTitle: string;
  data: Record<string, unknown>;
}

export interface TabOption {
  id: string;
  title: string;
  index?: number;
}

export interface SuspendPayload {
  reason?: string;
  documentId?: string;
  title?: string;
  requiresImageSelection?: boolean;
  requiresTabSelection?: boolean;
  imageCount?: number;
  tabs?: TabOption[];
}

export interface WorkflowRunResult {
  status: RunStatus.PENDING_REVIEW | RunStatus.COMPLETED;
  runId: string;
  messages: AgentRunMessage[];
  suspendPayload?: SuspendPayload;
  googleDocPayload?: PreviewPayload;
}

export interface ResumePayload {
  includeImages?: boolean;
  selectedTabIds?: string[];
}
