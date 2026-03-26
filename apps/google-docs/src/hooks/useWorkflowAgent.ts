import { useState, useCallback } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import {
  LOCAL_AGENTS_API_BASE_URL,
  POLL_INTERVAL_MS,
  MAX_POLL_ATTEMPTS,
  WORKFLOW_AGENT_ID,
} from '../utils/constants/agent';
import {
  AgentRunMessage,
  DocumentScopeResumePayload,
  DocumentScopeSuspendPayload,
  WorkflowRunResult,
  RunStatus,
} from '../utils/types';

interface UseWorkflowParams {
  sdk: PageAppSDK;
  documentId: string;
  oauthToken: string;
}

interface WorkflowHook {
  isAnalyzing: boolean;
  error: string | null;
  startWorkflow: (contentTypeIds: string[]) => Promise<WorkflowRunResult>;
  resumeWorkflow: (
    runId: string,
    resumePayload: DocumentScopeResumePayload
  ) => Promise<WorkflowRunResult>;
}

interface AgentGeneratePayload {
  messages: Array<{
    role: 'user';
    parts: Array<{
      type: 'text';
      text: string;
    }>;
  }>;
  metadata: {
    documentId: string;
    contentTypeIds: string;
    oauthToken: string;
  };
  threadId: string;
}

interface AgentRunData {
  sys?: {
    id?: string;
    status?: RunStatus;
  };
  metadata?: {
    status?: RunStatus;
    workflowId?: string;
    workflowRunId?: string;
    suspendPayload?: Record<string, unknown>;
  };
  payload?: string;
  messages?: AgentRunMessage[];
  error?: Record<string, unknown>;
}

const wait = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

const getRunStatus = (runData: AgentRunData): RunStatus | null => {
  return runData.sys?.status ?? runData.metadata?.status ?? null;
};

const getAgentPayload = (runData: AgentRunData): string | null => {
  if (runData.payload && typeof runData.payload === 'string') {
    return runData.payload;
  }

  if (!runData.messages || !Array.isArray(runData.messages)) {
    return null;
  }

  const assistantMessage = runData.messages.find((message) => message.role === 'assistant');
  if (!assistantMessage?.content?.parts) {
    return null;
  }

  const textPart = assistantMessage.content.parts.find((part) => part.type === 'text' && part.text);
  return textPart?.text || null;
};

const getRunErrorMessage = (runData: AgentRunData): string => {
  const payload = getAgentPayload(runData);
  if (payload) {
    return payload;
  }

  const errorMessage = runData.error?.message;
  if (typeof errorMessage === 'string' && errorMessage.trim().length > 0) {
    return errorMessage;
  }

  return 'Workflow failed';
};

const getSuspendPayload = (runData: AgentRunData): DocumentScopeSuspendPayload | undefined =>
  runData.metadata?.suspendPayload as DocumentScopeSuspendPayload | undefined;

const getWorkflowRunResult = (
  runData: AgentRunData,
  threadId: string
): WorkflowRunResult | null => {
  const status = getRunStatus(runData);

  switch (status) {
    case RunStatus.FAILED:
      throw new Error(getRunErrorMessage(runData));

    case RunStatus.PENDING_REVIEW: {
      const suspendPayload = getSuspendPayload(runData);
      if (!suspendPayload) {
        throw new Error('Workflow paused for review, but suspend payload was missing.');
      }

      return {
        status,
        runId: threadId,
        suspendPayload,
        messages: runData.messages ?? [],
      };
    }

    case RunStatus.COMPLETED:
      return {
        status,
        runId: threadId,
        messages: runData.messages ?? [],
      };

    default:
      return null;
  }
};

const fetchRunData = async (
  sdk: PageAppSDK,
  spaceId: string,
  environmentId: string,
  runId: string
): Promise<AgentRunData | null> => {
  if (LOCAL_AGENTS_API_BASE_URL) {
    const response = await fetch(
      `${LOCAL_AGENTS_API_BASE_URL}/spaces/${spaceId}/environments/${environmentId}/ai_agents/runs/${runId}`,
      {
        headers: {
          'x-contentful-enable-alpha-feature': 'agents-api',
          'X-Contentful-App-Definition-Id': '653vTnuQw3j5onU1tUoH6t',
        },
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
};

const resumeAgentRun = async (
  sdk: PageAppSDK,
  spaceId: string,
  environmentId: string,
  runId: string,
  resumePayload: DocumentScopeResumePayload
): Promise<void> => {
  if (LOCAL_AGENTS_API_BASE_URL) {
    const response = await fetch(
      `${LOCAL_AGENTS_API_BASE_URL}/spaces/${spaceId}/environments/${environmentId}/ai_agents/runs/${runId}/resume`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-contentful-enable-alpha-feature': 'agents-api',
          'X-Contentful-App-Definition-Id': '653vTnuQw3j5onU1tUoH6t',
        },
        body: JSON.stringify({ resumePayload }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to resume agent run: ${response.status} ${response.statusText}`);
    }

    return;
  }

  const agentRunApi = sdk.cma.agentRun as {
    resume?: (
      params: { spaceId: string; environmentId: string; runId: string },
      body: { resumePayload: DocumentScopeResumePayload }
    ) => Promise<unknown>;
  };

  if (!agentRunApi.resume) {
    throw new Error('Agent run resume is not available in the current SDK.');
  }

  await agentRunApi.resume({ spaceId, environmentId, runId }, { resumePayload });
};

const startAgentRun = async (
  sdk: PageAppSDK,
  spaceId: string,
  environmentId: string,
  payload: AgentGeneratePayload,
  threadId: string
): Promise<string> => {
  if (LOCAL_AGENTS_API_BASE_URL) {
    const response = await fetch(
      `${LOCAL_AGENTS_API_BASE_URL}/spaces/${spaceId}/environments/${environmentId}/ai_agents/agents/${WORKFLOW_AGENT_ID}/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-contentful-enable-alpha-feature': 'agents-api',
          'X-Contentful-App-Definition-Id': '653vTnuQw3j5onU1tUoH6t',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to start workflow agent run: ${response.status} ${response.statusText}`
      );
    }

    const runData = (await response.json()) as AgentRunData;

    return runData.sys?.id || threadId;
  }

  const runData = (await sdk.cma.agent.generate(
    { agentId: WORKFLOW_AGENT_ID, spaceId, environmentId },
    payload
  )) as AgentRunData;

  return runData.sys?.id || threadId;
};

const pollAgentRun = async (
  sdk: PageAppSDK,
  spaceId: string,
  environmentId: string,
  runId: string
): Promise<WorkflowRunResult> => {
  await wait(POLL_INTERVAL_MS);

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const runData = await fetchRunData(sdk, spaceId, environmentId, runId);
    if (!runData) {
      await wait(POLL_INTERVAL_MS);
      continue;
    }

    const workflowRun = getWorkflowRunResult(runData, runId);
    if (workflowRun) {
      return workflowRun;
    }

    await wait(POLL_INTERVAL_MS);
  }

  throw new Error('Workflow polling timeout');
};

export const useWorkflowAgent = ({
  sdk,
  documentId,
  oauthToken,
}: UseWorkflowParams): WorkflowHook => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startWorkflow = useCallback(
    async (contentTypeIds: string[]) => {
      setIsAnalyzing(true);
      setError(null);

      const spaceId = sdk.ids.space;
      const environmentId = sdk.ids.environment;
      const threadId = [crypto.randomUUID(), WORKFLOW_AGENT_ID].join('-');
      const contentTypeIdsCsv = contentTypeIds.join(',');

      const payload: AgentGeneratePayload = {
        messages: [
          {
            role: 'user' as const,
            parts: [
              {
                type: 'text' as const,
                text: `Analyze the following google docs document ${documentId} and extract the Contentful entries and assets for the following content types: ${contentTypeIds.join(
                  ', '
                )} with the following oauth token: ${oauthToken}`,
              },
            ],
          },
        ],
        metadata: {
          documentId,
          // TEMP workaround: send as comma-separated string for now; API workflow normalizes back to string[].
          contentTypeIds: contentTypeIdsCsv,
          // contentTypeIds,
          oauthToken,
        },
        threadId,
      };

      try {
        const runId = await startAgentRun(sdk, spaceId, environmentId, payload, threadId);
        return await pollAgentRun(sdk, spaceId, environmentId, runId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Workflow failed';
        setError(errorMessage);
        throw err instanceof Error ? err : new Error(errorMessage);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [sdk, documentId, oauthToken]
  );

  const resumeWorkflow = useCallback(
    async (runId: string, resumePayload: DocumentScopeResumePayload) => {
      setIsAnalyzing(true);
      setError(null);

      const spaceId = sdk.ids.space;
      const environmentId = sdk.ids.environment;

      try {
        await resumeAgentRun(sdk, spaceId, environmentId, runId, resumePayload);
        return await pollAgentRun(sdk, spaceId, environmentId, runId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Workflow failed';
        setError(errorMessage);
        throw err instanceof Error ? err : new Error(errorMessage);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [sdk]
  );

  return {
    isAnalyzing,
    error,
    startWorkflow,
    resumeWorkflow,
  };
};
