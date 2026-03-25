import { useState, useCallback } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import {
  LOCAL_AGENTS_API_BASE_URL,
  POLL_INTERVAL_MS,
  MAX_POLL_ATTEMPTS,
  USE_LOCAL_AGENTS_API,
  WORKFLOW_AGENT_ID,
} from '../utils/constants/agent';

interface UseWorkflowParams {
  sdk: PageAppSDK;
  documentId: string;
  oauthToken: string;
}

interface WorkflowHook {
  isAnalyzing: boolean;
  error: string | null;
  startWorkflow: (contentTypeIds: string[]) => Promise<void>;
}

type WorkflowRunStatus = 'IN_PROGRESS' | 'FAILED' | 'COMPLETED' | 'PENDING_REVIEW' | 'DRAFT';

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
    status?: WorkflowRunStatus;
  };
  metadata?: {
    status?: WorkflowRunStatus;
    workflowId?: string;
    workflowRunId?: string;
    suspendPayload?: Record<string, unknown>;
  };
  payload?: string;
  messages?: Array<{
    role: string;
    content?: {
      parts?: Array<{
        type: string;
        text?: string;
      }>;
    };
  }>;
  error?: Record<string, unknown>;
}

const wait = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

const startAgentRun = async (
  sdk: PageAppSDK,
  spaceId: string,
  environmentId: string,
  payload: AgentGeneratePayload,
  threadId: string
): Promise<string> => {
  if (USE_LOCAL_AGENTS_API) {
    const response = await fetch(
      `${LOCAL_AGENTS_API_BASE_URL}/spaces/${spaceId}/environments/${environmentId}/ai_agents/agents/${WORKFLOW_AGENT_ID}/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-contentful-enable-alpha-feature': 'agents-api',
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
): Promise<string | null> => {
  await wait(POLL_INTERVAL_MS);

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    let runData: AgentRunData;

    if (USE_LOCAL_AGENTS_API) {
      const response = await fetch(
        `${LOCAL_AGENTS_API_BASE_URL}/spaces/${spaceId}/environments/${environmentId}/ai_agents/runs/${runId}`,
        {
          headers: {
            'x-contentful-enable-alpha-feature': 'agents-api',
          },
        }
      );

      if (response.status === 404) {
        await wait(POLL_INTERVAL_MS);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Failed to poll agent run: ${response.status} ${response.statusText}`);
      }

      runData = (await response.json()) as AgentRunData;
    } else {
      try {
        runData = (await sdk.cma.agentRun.get({
          spaceId,
          environmentId,
          runId,
        })) as AgentRunData;
      } catch (error: unknown) {
        const err = error as { code?: string };
        if (err?.code === 'NotFound') {
          await wait(POLL_INTERVAL_MS);
          continue;
        }
        throw error;
      }
    }

    if (status === 'PENDING_REVIEW') {
      console.log('Workflow paused for review. Suspend/resume UI is not wired yet.');
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
        await pollAgentRun(sdk, spaceId, environmentId, runId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Workflow failed';
        setError(errorMessage);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [sdk, documentId, oauthToken]
  );

  return {
    isAnalyzing,
    error,
    startWorkflow,
  };
};
