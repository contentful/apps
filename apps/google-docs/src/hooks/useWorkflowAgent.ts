import { useState, useCallback } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { POLL_INTERVAL_MS, MAX_POLL_ATTEMPTS, WORKFLOW_AGENT_ID } from '../utils/constants/agent';
import {
  ResumePayload,
  SuspendPayload,
  PreviewPayload,
  WorkflowRunResult,
  RunStatus,
} from '@types';
import {
  AgentGeneratePayload,
  AgentRunData,
  getWorkflowRun,
  resumeWorkflowRun,
  startAgentRun,
} from '../services/agents-api';
import { validatePayloadShape } from '../utils/previewPayload';

interface UseWorkflowParams {
  sdk: PageAppSDK;
  documentId: string;
  oauthToken: string;
}

interface WorkflowHook {
  isAnalyzing: boolean;
  error: string | null;
  startWorkflow: (contentTypeIds: string[]) => Promise<WorkflowRunResult>;
  resumeWorkflow: (runId: string, resumePayload: ResumePayload) => Promise<WorkflowRunResult>;
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

const previewPayloadFromCompletedRun = (runData: AgentRunData): PreviewPayload => {
  const raw = runData.metadata?.googleDocPayload;
  if (raw == null) {
    throw new Error('Workflow completed but result payload was missing.');
  }

  return validatePayloadShape(raw);
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

const getSuspendPayload = (runData: AgentRunData): SuspendPayload | undefined =>
  runData.metadata?.suspendPayload as SuspendPayload | undefined;

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

    case RunStatus.COMPLETED: {
      const messages = runData.messages ?? [];

      return {
        status,
        runId: threadId,
        messages,
        googleDocPayload: previewPayloadFromCompletedRun(runData),
      };
    }

    default:
      return null;
  }
};

const pollAgentRun = async (
  sdk: PageAppSDK,
  spaceId: string,
  environmentId: string,
  runId: string
): Promise<WorkflowRunResult> => {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const runData = await getWorkflowRun(sdk, spaceId, environmentId, runId);
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
        const runId = await startAgentRun(sdk, spaceId, environmentId, payload);
        return await pollAgentRun(sdk, spaceId, environmentId, runId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Workflow failed');
        setError(error.message);
        throw error;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [sdk, documentId, oauthToken]
  );

  const resumeWorkflow = useCallback(
    async (runId: string, resumePayload: ResumePayload) => {
      setIsAnalyzing(true);
      setError(null);

      const spaceId = sdk.ids.space;
      const environmentId = sdk.ids.environment;

      try {
        await resumeWorkflowRun(sdk, spaceId, environmentId, runId, resumePayload);
        return await pollAgentRun(sdk, spaceId, environmentId, runId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Workflow failed');
        setError(error.message);
        throw error;
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
