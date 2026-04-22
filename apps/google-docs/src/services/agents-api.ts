import { PageAppSDK } from '@contentful/app-sdk';
import { LOCAL_AGENTS_API_BASE_URL, USE_LOCAL_AGENTS_API, WORKFLOW_AGENT_ID } from '../utils/constants/agent';
import {
  AgentRunMessage,
  MappingReviewSuspendPayload,
  ResumePayload,
  RunStatus,
  TabsImagesSuspendPayload,
} from '@types';

const AGENTS_API_HEADERS = {
  'x-contentful-enable-alpha-feature': 'agents-api',
  'X-Contentful-App-Definition-Id': '653vTnuQw3j5onU1tUoH6t',
};

function getJsonHeaders(): HeadersInit {
  return {
    ...AGENTS_API_HEADERS,
    'Content-Type': 'application/json',
  };
}

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
    googleDocPayload?: Record<string, unknown>;
  };
  payload?: string;
  messages?: AgentRunMessage[];
  error?: Record<string, unknown>;
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
    console.log('[getWorkflowRun] calling sdk.cma.agentRun.get for run', runId);
    const result = (await sdk.cma.agentRun.get({
      spaceId,
      environmentId,
      runId,
    })) as AgentRunData;
    console.log('[getWorkflowRun] run status:', result?.sys?.status ?? result?.metadata?.status, 'full:', JSON.stringify(result));
    return result;
  } catch (error: unknown) {
    console.error('[getWorkflowRun] error:', error);
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
      console.log('[startAgentRun] calling sdk.cma.agent.generate for agent', WORKFLOW_AGENT_ID, 'space', spaceId, 'env', environmentId, 'threadId', payload.threadId);
      runData = (await sdk.cma.agent.generate(
        { agentId: WORKFLOW_AGENT_ID, spaceId, environmentId },
        payload
      )) as AgentRunData;
      console.log('[startAgentRun] generate response:', JSON.stringify(runData));
    } catch (error) {
      console.error('[startAgentRun] sdk.cma.agent.generate failed:', error);
      throw new Error(`Failed to start workflow agent run: ${error as Error}`);
    }
  }

  if (!runData.sys?.id) {
    console.error('[startAgentRun] no run ID in response:', JSON.stringify(runData));
    throw new Error('Agent run started but no run ID was returned');
  }

  console.log('[startAgentRun] run started with ID', runData.sys.id);
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

  try {
    console.log('[resumeWorkflowRun] calling sdk.cma.agentRun.resumeRun for run', runId, 'payload:', resumePayload);
    await sdk.cma.agentRun.resumeRun(
      { spaceId, environmentId, runId },
      { resumePayload: resumePayload as Record<string, unknown> }
    );
    console.log('[resumeWorkflowRun] resumeRun succeeded');
  } catch (error) {
    console.error('[resumeWorkflowRun] resumeRun failed:', error);
    throw error;
  }
}
