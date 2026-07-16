import { PageAppSDK } from '@contentful/app-sdk';
import {
  ResumePayload,
  WorkflowRunResult,
  RunStatus,
  WorkflowFailureReason,
  WorkflowRunError,
  MappingReviewSuspendPayload,
  CompletedWorkflowPayload,
  AgentRunMessage,
} from '@types';
import { AgentRunData, getWorkflowRun, resumeWorkflowRun } from './agents-api';
import { validatePayloadShape } from '../utils/createEntries';
import { ERROR_MESSAGES } from '@constants/messages';
import {
  POLL_INTERVAL_MS,
  MAX_POLL_ATTEMPTS,
  MAX_PENDING_REVIEW_MISSING_PAYLOAD_RETRIES,
} from '../utils/constants/agent';

// ─── Helpers (shared between workflowService and useWorkflowAgent) ───────────

const wait = async (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const getRunStatus = (runData: AgentRunData): RunStatus | null =>
  runData.sys?.status ?? runData.metadata?.status ?? null;

const getAgentPayload = (runData: AgentRunData): string | null => {
  if (runData.payload && typeof runData.payload === 'string') return runData.payload;
  if (!runData.messages || !Array.isArray(runData.messages)) return null;
  const assistantMessage = runData.messages.find((m) => m.role === 'assistant');
  if (!assistantMessage?.content?.parts) return null;
  const textPart = assistantMessage.content.parts.find((p) => p.type === 'text' && p.text);
  return textPart?.text ?? null;
};

const previewPayloadFromCompletedRun = (runData: AgentRunData): CompletedWorkflowPayload => {
  const googleDocPayload = runData.metadata?.googleDocPayload;
  if (googleDocPayload == null)
    throw new Error('Workflow completed but result payload was missing.');
  if (
    typeof googleDocPayload === 'object' &&
    googleDocPayload !== null &&
    'cancelled' in googleDocPayload &&
    (googleDocPayload as { cancelled?: unknown }).cancelled === true
  ) {
    return { entries: [], assets: [], referenceGraph: {} };
  }
  return validatePayloadShape(googleDocPayload);
};

const getRunErrorMessage = (runData: AgentRunData): string => {
  const failureMessage = runData.metadata?.workflowFailure?.message;
  if (typeof failureMessage === 'string' && failureMessage.trim().length > 0) return failureMessage;
  const payload = getAgentPayload(runData);
  if (payload) return payload;
  return 'Workflow failed';
};

const KNOWN_FAILURE_REASONS = new Set<string>(Object.values(WorkflowFailureReason));

export const getBackendWorkflowFailureReason = (
  runData: AgentRunData
): WorkflowFailureReason | null => {
  const workflowFailure = runData.metadata?.workflowFailure;
  if (!workflowFailure) return null;
  return KNOWN_FAILURE_REASONS.has(workflowFailure.code)
    ? (workflowFailure.code as WorkflowFailureReason)
    : null;
};

const FAILURE_REASON_MESSAGES: Partial<Record<WorkflowFailureReason, string>> = {
  [WorkflowFailureReason.GOOGLE_DRIVE_AUTH_EXPIRED]: ERROR_MESSAGES.GOOGLE_DRIVE_AUTH_ERROR,
  [WorkflowFailureReason.GOOGLE_DOCS_NOT_FOUND]: ERROR_MESSAGES.GOOGLE_DOCS_NOT_FOUND,
  [WorkflowFailureReason.AI_SERVICE_UNAVAILABLE]: ERROR_MESSAGES.AI_SERVICE_UNAVAILABLE,
  [WorkflowFailureReason.APP_NOT_INSTALLED]: ERROR_MESSAGES.APP_NOT_INSTALLED,
  [WorkflowFailureReason.DOCUMENT_TOO_COMPLEX]: ERROR_MESSAGES.DOCUMENT_TOO_COMPLEX,
  [WorkflowFailureReason.PROCESSING_TIMEOUT]: ERROR_MESSAGES.PROCESSING_TIMEOUT,
  [WorkflowFailureReason.OUT_OF_DOMAIN]: ERROR_MESSAGES.OUT_OF_DOMAIN,
};

const getWorkflowFailureMessage = (
  runData: AgentRunData,
  failureReason: WorkflowFailureReason
): string => FAILURE_REASON_MESSAGES[failureReason] ?? getRunErrorMessage(runData);

export const getSuspendPayload = (runData: AgentRunData): MappingReviewSuspendPayload | undefined =>
  runData.metadata?.suspendPayload;

export const getWorkflowRunResult = (
  runData: AgentRunData,
  runId: string,
  pendingReviewMissingPayloadCount: number
): WorkflowRunResult | null => {
  const status = getRunStatus(runData);

  switch (status) {
    case RunStatus.FAILED: {
      const failureReason =
        getBackendWorkflowFailureReason(runData) ?? WorkflowFailureReason.GENERIC;
      throw new WorkflowRunError(getWorkflowFailureMessage(runData, failureReason), failureReason);
    }

    case RunStatus.PENDING_REVIEW: {
      const suspendPayload = getSuspendPayload(runData);
      if (!suspendPayload) {
        if (pendingReviewMissingPayloadCount < MAX_PENDING_REVIEW_MISSING_PAYLOAD_RETRIES) {
          return null;
        }
        throw new Error('Workflow paused for review, but suspend payload was missing.');
      }
      return {
        status,
        runId,
        suspendPayload,
        messages: runData.messages ?? [],
      };
    }

    case RunStatus.COMPLETED: {
      return {
        status,
        runId,
        messages: runData.messages ?? [],
        googleDocPayload: previewPayloadFromCompletedRun(runData),
      };
    }

    default:
      return null;
  }
};

const elapsedSec = (startMs: number) => `${((Date.now() - startMs) / 1000).toFixed(1)}s`;

export const pollAgentRun = async (
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
  throw new WorkflowRunError(
    ERROR_MESSAGES.PROCESSING_TIMEOUT,
    WorkflowFailureReason.PROCESSING_TIMEOUT
  );
};

// ─── Public API ───────────────────────────────────────────────────────────────

export async function resumeAndPollWorkflow(
  sdk: PageAppSDK,
  runId: string,
  resumePayload: ResumePayload
): Promise<WorkflowRunResult> {
  const spaceId = sdk.ids.space;
  const environmentId = sdk.ids.environmentAlias ?? sdk.ids.environment;

  await resumeWorkflowRun(sdk, spaceId, environmentId, runId, resumePayload);
  return pollAgentRun(sdk, spaceId, environmentId, runId);
}
