import { PageAppSDK } from '@contentful/app-sdk';
import { WORKFLOW_AGENT_ID } from '../utils/constants/agent';
import { normalizeAiAccessError } from '../utils/aiAccess';
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
    progressMessage?: string;
  };
  payload?: string;
  messages?: AgentRunMessage[];
  error?: Record<string, unknown>;
}

type AgentRunResumeParams = {
  spaceId: string;
  environmentId: string;
  runId: string;
};

type AgentRunResumeApi = {
  resumeRun?: (
    params: AgentRunResumeParams,
    body: { resumePayload: Record<string, unknown> }
  ) => Promise<unknown>;
  resume?: (
    params: AgentRunResumeParams,
    body: { resumePayload: ResumePayload }
  ) => Promise<unknown>;
};

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
  const localAgentsApiBaseUrl = import.meta.env.VITE_LOCAL_AGENTS_API_BASE_URL?.trim();
  if (localAgentsApiBaseUrl) {
    const response = await fetch(
      `${localAgentsApiBaseUrl}/spaces/${spaceId}/environments/${environmentId}/ai_agents/runs/${runId}`,
      {
        headers: AGENTS_API_HEADERS,
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw normalizeAiAccessError({ status: response.status, ...body });
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

    throw normalizeAiAccessError(error);
  }
}

export async function startAgentRun(
  sdk: PageAppSDK,
  spaceId: string,
  environmentId: string,
  payload: AgentGeneratePayload
): Promise<string> {
  let runData: AgentRunData;
  const localAgentsApiBaseUrl = import.meta.env.VITE_LOCAL_AGENTS_API_BASE_URL?.trim();

  if (localAgentsApiBaseUrl) {
    const response = await fetch(
      `${localAgentsApiBaseUrl}/spaces/${spaceId}/environments/${environmentId}/ai_agents/agents/${WORKFLOW_AGENT_ID}/generate`,
      {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw normalizeAiAccessError({ status: response.status, ...body });
    }

    runData = (await response.json()) as AgentRunData;
  } else {
    try {
      runData = (await sdk.cma.agent.generate(
        { agentId: WORKFLOW_AGENT_ID, spaceId, environmentId },
        payload
      )) as AgentRunData;
    } catch (error) {
      throw normalizeAiAccessError(error);
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
  const localAgentsApiBaseUrl = import.meta.env.VITE_LOCAL_AGENTS_API_BASE_URL?.trim();
  if (localAgentsApiBaseUrl) {
    const response = await fetch(
      `${localAgentsApiBaseUrl}/spaces/${spaceId}/environments/${environmentId}/ai_agents/runs/${runId}/resume`,
      {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify({ resumePayload }),
      }
    );

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw normalizeAiAccessError({ status: response.status, ...body });
    }

    return;
  }

  const agentRunApi = sdk.cma.agentRun as AgentRunResumeApi;

  if (agentRunApi.resumeRun) {
    try {
      await agentRunApi.resumeRun(
        { spaceId, environmentId, runId },
        { resumePayload: resumePayload as Record<string, unknown> }
      );
      return;
    } catch (error) {
      throw normalizeAiAccessError(error);
    }
  }

  if (!agentRunApi.resume) {
    throw new Error('Agent run resume is not available in the current SDK.');
  }

  try {
    await agentRunApi.resume({ spaceId, environmentId, runId }, { resumePayload });
  } catch (error) {
    throw normalizeAiAccessError(error);
  }
}
