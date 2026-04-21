import { PageAppSDK } from '@contentful/app-sdk';
import { WORKFLOW_AGENT_ID } from '../utils/constants/agent';
import {
  AgentRunMessage,
  MappingReviewSuspendPayload,
  ResumePayload,
  RunStatus,
  TabsImagesSuspendPayload,
} from '@types';

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

  try {
    runData = (await sdk.cma.agent.generate(
      { agentId: WORKFLOW_AGENT_ID, spaceId, environmentId },
      payload
    )) as AgentRunData;
  } catch (error) {
    throw new Error(`Failed to start workflow agent run: ${error as Error}`);
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
  const agentRunApi = sdk.cma.agentRun as {
    resume?: (
      params: { spaceId: string; environmentId: string; runId: string },
      body: { resumePayload: ResumePayload }
    ) => Promise<unknown>;
  };

  if (!agentRunApi.resume) {
    throw new Error('Agent run resume is not available in the current SDK.');
  }

  await agentRunApi.resume({ spaceId, environmentId, runId }, { resumePayload });
}
