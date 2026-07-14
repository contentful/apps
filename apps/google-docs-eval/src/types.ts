export interface AgentRunSys {
  id: string;
  type: string;
  status: 'IN_PROGRESS' | 'FAILED' | 'COMPLETED' | 'PENDING_REVIEW' | 'DRAFT';
  createdAt: string;
}

export interface ToolInvocationPart {
  type: 'tool-invocation';
  toolInvocation: {
    toolName: string;
    args?: { inputData?: { documentId?: string; contentTypeIds?: string[] } };
    result?: string;
  };
}

export type MessagePart =
  | { type: 'text'; text: string }
  | { type: 'step-start' }
  | ToolInvocationPart;

export interface RunMessage {
  id?: string;
  createdAt?: string;
  role: string;
  content?: { parts?: MessagePart[] };
}

export interface AgentRun {
  sys: AgentRunSys;
  title?: string;
  messages?: RunMessage[];
  metadata?: {
    googleDocPayload?: {
      entries?: unknown[];
      assets?: unknown[];
      referenceGraph?: unknown;
    };
  };
}

export interface ScoreResult {
  scorerId: string;
  score: number;
  reason: string;
}

export interface ScoreResponse {
  runId: string;
  scores: ScoreResult[];
}
