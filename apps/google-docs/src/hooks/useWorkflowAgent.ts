import { useState, useCallback } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import {
  POLL_INTERVAL_MS,
  MAX_POLL_ATTEMPTS,
  WORKFLOW_AGENT_ID,
  MAX_PENDING_REVIEW_MISSING_PAYLOAD_RETRIES,
} from '../utils/constants/agent';
import {
  MappingReviewSuspendPayload,
  ResumePayload,
  TabsImagesSuspendPayload,
  CompletedWorkflowPayload,
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
import { validatePayloadShape } from '../utils/createEntries';

interface UseWorkflowParams {
  sdk: PageAppSDK;
  documentId: string;
  oauthToken: string;
}

interface WorkflowHook {
  isAnalyzing: boolean;
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

const previewPayloadFromCompletedRun = (runData: AgentRunData): CompletedWorkflowPayload => {
  const googleDocPayload = runData.metadata?.googleDocPayload;
  if (googleDocPayload == null) {
    throw new Error('Workflow completed but result payload was missing.');
  }

  if (
    typeof googleDocPayload === 'object' &&
    googleDocPayload !== null &&
    'cancelled' in googleDocPayload &&
    (googleDocPayload as { cancelled?: unknown }).cancelled === true
  ) {
    const documentId =
      'documentId' in googleDocPayload &&
      typeof (googleDocPayload as { documentId?: unknown }).documentId === 'string'
        ? (googleDocPayload as { documentId: string }).documentId
        : '';
    const title =
      'title' in googleDocPayload &&
      typeof (googleDocPayload as { title?: unknown }).title === 'string'
        ? (googleDocPayload as { title: string }).title
        : undefined;

    // Cancelled runs complete without full preview payload; return a no-op preview shape.
    return {
      entries: [],
      assets: [],
      referenceGraph: {},
    };
  }

  return validatePayloadShape(googleDocPayload);
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

const getSuspendPayload = (
  runData: AgentRunData
): TabsImagesSuspendPayload | MappingReviewSuspendPayload | undefined => {
  return runData.metadata?.suspendPayload;
};

const getWorkflowRunResult = (
  runData: AgentRunData,
  threadId: string,
  pendingReviewMissingPayloadCount: number
): WorkflowRunResult | null => {
  const status = getRunStatus(runData);

  switch (status) {
    case RunStatus.FAILED:
      throw new Error(getRunErrorMessage(runData));

    case RunStatus.PENDING_REVIEW: {
      const suspendPayload = getSuspendPayload(runData);
      if (!suspendPayload) {
        if (pendingReviewMissingPayloadCount < MAX_PENDING_REVIEW_MISSING_PAYLOAD_RETRIES) {
          return null; // suspendPayload not flushed yet; poller will retry
        }
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

const elapsedSec = (startMs: number) => `${((Date.now() - startMs) / 1000).toFixed(1)}s`;

const pollAgentRun = async (
  sdk: PageAppSDK,
  spaceId: string,
  environmentId: string,
  runId: string
): Promise<WorkflowRunResult> => {
  const startMs = Date.now();
  let pendingReviewMissingPayloadCount = 0;
  console.log(`⏳ Polling run [${runId}]`);

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const runData = await getWorkflowRun(sdk, spaceId, environmentId, runId);

    if (!runData) {
      console.log(`  #${attempt + 1} — not found yet (${elapsedSec(startMs)})`);
      await wait(POLL_INTERVAL_MS);
      continue;
    }

    const status = getRunStatus(runData);
    console.log(`  #${attempt + 1} — status: ${status} (${elapsedSec(startMs)})`);

    if (status === RunStatus.PENDING_REVIEW && !getSuspendPayload(runData)) {
      pendingReviewMissingPayloadCount++;
    } else {
      pendingReviewMissingPayloadCount = 0;
    }

    const workflowRun = getWorkflowRunResult(runData, runId, pendingReviewMissingPayloadCount);
    if (workflowRun) {
      console.log(`✓ Run [${runId}] settled: ${status} in ${elapsedSec(startMs)}`);
      return workflowRun;
    }

    await wait(POLL_INTERVAL_MS);
  }

  console.error(`✗ Run [${runId}] timed out after ${elapsedSec(startMs)}`);
  throw new Error('Workflow polling timeout');
};

export const useWorkflowAgent = ({
  sdk,
  documentId,
  oauthToken,
}: UseWorkflowParams): WorkflowHook => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const startWorkflow = useCallback(
    async (contentTypeIds: string[]) => {
      setIsAnalyzing(true);

      const spaceId = sdk.ids.space;
      const environmentId = sdk.ids.environment;
      const threadId = [crypto.randomUUID(), WORKFLOW_AGENT_ID].join('-');

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
          contentTypeIds,
          oauthToken,
        },
        threadId,
      };

      try {
        const runId = await startAgentRun(sdk, spaceId, environmentId, payload);
        return await pollAgentRun(sdk, spaceId, environmentId, runId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Workflow failed');
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

      const spaceId = sdk.ids.space;
      const environmentId = sdk.ids.environment;

      try {
        await resumeWorkflowRun(sdk, spaceId, environmentId, runId, resumePayload);
        return await pollAgentRun(sdk, spaceId, environmentId, runId);
      } catch (err) {
        console.error(`✗ resumeWorkflow [${runId}] failed`, err);
        const error = err instanceof Error ? err : new Error('Workflow failed');
        throw error;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [sdk]
  );

  return {
    isAnalyzing,
    startWorkflow,
    resumeWorkflow,
  };
};
