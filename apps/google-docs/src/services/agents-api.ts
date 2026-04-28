import { PageAppSDK } from '@contentful/app-sdk';
import {
  LOCAL_AGENTS_API_BASE_URL,
  WORKFLOW_AGENT_ID,
  USE_LOCAL_AGENTS_API,
} from '../utils/constants/agent';
import {
  AgentRunMessage,
  MappingReviewSuspendPayload,
  ResumePayload,
  RunStatus,
  TabsImagesSuspendPayload,
  WorkflowFailure,
} from '@types';

const AGENTS_API_HEADERS = {
  'x-contentful-enable-alpha-feature': 'agents-api',
  'X-Contentful-App-Definition-Id': '653vTnuQw3j5onU1tUoH6t',
};

export interface AgentGeneratePayload {
  messages: Array<{
    role: 'user';
    parts: Array<{
      type: 'text';
      text: string;
    }>;
  }>;
  metadata: {
    documentId: string;
    contentTypeIds: string[];
    oauthToken: string;
  };
  threadId: string;
}

export interface AgentRunData {
  sys?: {
    id?: string;
    status?: RunStatus;
  };
  metadata?: {
    status?: RunStatus;
    workflowId?: string;
    workflowRunId?: string;
    suspendPayload?: TabsImagesSuspendPayload | MappingReviewSuspendPayload;
    workflowFailure?: WorkflowFailure;
    googleDocPayload?: Record<string, unknown>;
  };
  payload?: string;
  messages?: AgentRunMessage[];
  error?: Record<string, unknown>;
}

function getJsonHeaders(): HeadersInit {
  return {
    ...AGENTS_API_HEADERS,
    'Content-Type': 'application/json',
  };
}

export async function getWorkflowRun(
  sdk: PageAppSDK,
  spaceId: string,
  environmentId: string,
  runId: string
): Promise<AgentRunData | null> {
  if (USE_LOCAL_AGENTS_API) {
    const response = await fetch(
      `${LOCAL_AGENTS_API_BASE_URL}/spaces/${spaceId}/environments/${environmentId}/ai_agents/runs/${runId}`,
      {
        headers: AGENTS_API_HEADERS,
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to poll agent run: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as AgentRunData;
  }

  try {
    return (await sdk.cma.agentRun.get({
      spaceId,
      environmentId,
      runId,
    })) as AgentRunData;
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err?.code === 'NotFound') {
      return null;
    }

    throw error;
  }
}

export async function startAgentRun(
  sdk: PageAppSDK,
  spaceId: string,
  environmentId: string,
  payload: AgentGeneratePayload
): Promise<string> {
  let runData: AgentRunData;

  if (USE_LOCAL_AGENTS_API) {
    const response = await fetch(
      `${LOCAL_AGENTS_API_BASE_URL}/spaces/${spaceId}/environments/${environmentId}/ai_agents/agents/${WORKFLOW_AGENT_ID}/generate`,
      {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to start workflow agent run: ${response.status} ${response.statusText}`
      );
    }

    runData = (await response.json()) as AgentRunData;
  } else {
    try {
      runData = (await sdk.cma.agent.generate(
        { agentId: WORKFLOW_AGENT_ID, spaceId, environmentId },
        payload
      )) as AgentRunData;
    } catch (error) {
      throw new Error(`Failed to start workflow agent run: ${error as Error}`);
    }
  }

  if (!runData.sys?.id) {
    throw new Error('Agent run started but no run ID was returned');
  }

  return runData.sys.id;
}

/**
 * Resumes a suspended agent run. For the Google Docs mapping-review step, the
 * edited `entryBlockGraph` must live in `resumePayload` (see Network tab). After resume,
 * mapping-review repopulates `metadata.suspendPayload` with the reviewed graph (the resume
 * handler clears it first).
 */
export async function resumeWorkflowRun(
  sdk: PageAppSDK,
  spaceId: string,
  environmentId: string,
  runId: string,
  resumePayload: ResumePayload
): Promise<void> {
  if (USE_LOCAL_AGENTS_API) {
    const response = await fetch(
      `${LOCAL_AGENTS_API_BASE_URL}/spaces/${spaceId}/environments/${environmentId}/ai_agents/runs/${runId}/resume`,
      {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify({ resumePayload }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to resume agent run: ${response.status} ${response.statusText}`);
    }

    return;
  }

  await sdk.cma.agentRun.resumeRun(
    { spaceId, environmentId, runId },
    { resumePayload: resumePayload as Record<string, unknown> }
  );
}
