import { useState, useEffect, useRef, useCallback } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { RunStatus } from '@types';
import { getWorkflowRun, AgentRunData } from '../services/agents-api';
import { DisplayStatus } from '../types/runs';
import type { RunRecord } from '../types/runs';

const POLL_INTERVAL_MS = 10_000;

// A null response (404 or network error) is treated as transient until this
// many consecutive misses — matching MAX_PENDING_REVIEW_MISSING_PAYLOAD_RETRIES.
const MAX_CONSECUTIVE_NULLS = 5;

export const TERMINAL_STATUSES = new Set([
  DisplayStatus.COMPLETED,
  DisplayStatus.FAILED,
  DisplayStatus.EXPIRED,
]);

const RUN_STATUS_TO_DISPLAY: Partial<Record<RunStatus, DisplayStatus>> = {
  [RunStatus.IN_PROGRESS]: DisplayStatus.RUNNING,
  [RunStatus.DRAFT]: DisplayStatus.RUNNING,
  [RunStatus.PENDING_REVIEW]: DisplayStatus.NEEDS_REVIEW,
  [RunStatus.COMPLETED]: DisplayStatus.COMPLETED,
  [RunStatus.FAILED]: DisplayStatus.FAILED,
};

function toDisplayStatus(runData: AgentRunData | null): DisplayStatus | null {
  if (!runData) return null;
  const status = runData.sys?.status ?? runData.metadata?.status;
  return (status && RUN_STATUS_TO_DISPLAY[status]) ?? DisplayStatus.EXPIRED;
}

function extractErrorMessage(runData: AgentRunData | null): string | undefined {
  return runData?.metadata?.workflowFailure?.message;
}

function isActive(status: DisplayStatus | undefined): boolean {
  return !TERMINAL_STATUSES.has(status ?? DisplayStatus.LOADING);
}

export interface UseRunsPollingResult {
  statusMap: Map<string, DisplayStatus>;
  errorMap: Map<string, string>;
  titleMap: Map<string, string>;
}

export function useRunsPolling(runs: RunRecord[], sdk: PageAppSDK): UseRunsPollingResult {
  const [statusMap, setStatusMap] = useState<Map<string, DisplayStatus>>(new Map());
  const [errorMap, setErrorMap] = useState<Map<string, string>>(new Map());
  const [titleMap, setTitleMap] = useState<Map<string, string>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Mirrors the latest committed maps so fetchAllStatuses reads current state without stale closures.
  const statusRef = useRef<Map<string, DisplayStatus>>(new Map());
  const errorRef = useRef<Map<string, string>>(new Map());
  const titleRef = useRef<Map<string, string>>(new Map());
  // Tracks consecutive null responses per runId to distinguish transient from permanent 404s.
  const nullCountRef = useRef<Map<string, number>>(new Map());

  const fetchAllStatuses = useCallback(async (): Promise<{
    nextStatus: Map<string, DisplayStatus>;
    hasActive: boolean;
  } | null> => {
    if (runs.length === 0) return null;

    const spaceId = sdk.ids.space;
    const environmentId = sdk.ids.environmentAlias ?? sdk.ids.environment;
    const currentStatus = statusRef.current;

    // Only poll runs that haven't reached a terminal state yet.
    const activeRuns = runs.filter((r) => isActive(currentStatus.get(r.runId)));

    if (activeRuns.length === 0) return null;

    const results = await Promise.all(
      activeRuns.map((r) => getWorkflowRun(sdk, spaceId, environmentId, r.runId).catch(() => null))
    );

    // Start from existing state so terminal runs keep their status/errors/titles.
    const nextStatus = new Map(currentStatus);
    const nextErrors = new Map(errorRef.current);
    const nextTitles = new Map(titleRef.current);

    for (let i = 0; i < activeRuns.length; i++) {
      const runId = activeRuns[i].runId;
      const data = results[i];
      const resolved = toDisplayStatus(data);

      if (resolved === null) {
        // Transient null (404 or network blip) — only expire after threshold.
        const misses = (nullCountRef.current.get(runId) ?? 0) + 1;
        nullCountRef.current.set(runId, misses);
        if (misses >= MAX_CONSECUTIVE_NULLS) {
          nextStatus.set(runId, DisplayStatus.EXPIRED);
          nextErrors.delete(runId);
        }
        // else: leave existing status intact (stays LOADING/RUNNING)
      } else {
        nullCountRef.current.delete(runId);
        nextStatus.set(runId, resolved);
        const errMsg = extractErrorMessage(data);
        if (errMsg) {
          nextErrors.set(runId, errMsg);
        } else {
          nextErrors.delete(runId);
        }
        const title = data?.metadata?.suspendPayload?.documentTitle;
        if (title) nextTitles.set(runId, title);
      }
    }

    statusRef.current = nextStatus;
    errorRef.current = nextErrors;
    titleRef.current = nextTitles;
    setStatusMap(nextStatus);
    setErrorMap(nextErrors);
    setTitleMap(nextTitles);

    // A run is "active" if it has no terminal status in the map (undefined → LOADING is active).
    const hasActive = runs.some((r) => isActive(nextStatus.get(r.runId)));
    return { nextStatus, hasActive };
  }, [runs, sdk]);

  useEffect(() => {
    void fetchAllStatuses().then((result) => {
      if (!result?.hasActive) return;

      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        void fetchAllStatuses().then((updated) => {
          if (!updated?.hasActive && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        });
      }, POLL_INTERVAL_MS);
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchAllStatuses]);

  return { statusMap, errorMap, titleMap };
}
