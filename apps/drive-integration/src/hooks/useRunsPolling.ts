import { useState, useEffect, useRef, useCallback } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { RunStatus } from '@types';
import { getWorkflowRun, AgentRunData } from '../services/agents-api';
import type { DisplayStatus, RunRecord } from '../types/runs';

const POLL_INTERVAL_MS = 10_000;

function toDisplayStatus(runData: AgentRunData | null): DisplayStatus {
  if (!runData) return 'expired';
  const status = runData.sys?.status ?? runData.metadata?.status;
  switch (status) {
    case RunStatus.IN_PROGRESS:
    case RunStatus.DRAFT:
      return 'running';
    case RunStatus.PENDING_REVIEW:
      return 'needs-review';
    case RunStatus.COMPLETED:
      return 'completed';
    case RunStatus.FAILED:
      return 'failed';
    default:
      return 'expired';
  }
}

function extractErrorMessage(runData: AgentRunData | null): string | undefined {
  return runData?.metadata?.workflowFailure?.message ?? undefined;
}

export interface UseRunsPollingResult {
  statusMap: Map<string, DisplayStatus>;
  errorMap: Map<string, string>;
  titleMap: Map<string, string>;
}

export function useRunsPolling(runs: RunRecord[], sdk: PageAppSDK): UseRunsPollingResult {
  const [statusMap, setStatusMap] = useState<Map<string, DisplayStatus>>(
    () => new Map(runs.map((r) => [r.runId, 'loading' as DisplayStatus]))
  );
  const [errorMap, setErrorMap] = useState<Map<string, string>>(new Map());
  const [titleMap, setTitleMap] = useState<Map<string, string>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAllStatuses = useCallback(async () => {
    if (runs.length === 0) return;

    const spaceId = sdk.ids.space;
    const environmentId = sdk.ids.environmentAlias ?? sdk.ids.environment;

    const results = await Promise.all(
      runs.map((r) =>
        getWorkflowRun(sdk, spaceId, environmentId, r.runId).catch(() => null)
      )
    );

    const nextStatus = new Map<string, DisplayStatus>();
    const nextErrors = new Map<string, string>();
    const nextTitles = new Map<string, string>();

    for (let i = 0; i < runs.length; i++) {
      const runId = runs[i].runId;
      const data = results[i];
      nextStatus.set(runId, toDisplayStatus(data));
      const errMsg = extractErrorMessage(data);
      if (errMsg) nextErrors.set(runId, errMsg);
      const title = data?.metadata?.suspendPayload?.documentTitle;
      if (title) nextTitles.set(runId, title);
    }

    setStatusMap(nextStatus);
    setErrorMap(nextErrors);
    setTitleMap(nextTitles);
    return nextStatus;
  }, [runs, sdk]);

  // Initial fetch + reactive refetch when run list changes
  useEffect(() => {
    // Reset new runs to 'loading'
    setStatusMap((prev) => {
      const next = new Map(prev);
      for (const r of runs) {
        if (!next.has(r.runId)) next.set(r.runId, 'loading');
      }
      return next;
    });

    void fetchAllStatuses().then((nextStatus) => {
      if (!nextStatus) return;
      const hasRunning = [...nextStatus.values()].some((s) => s === 'running');

      if (intervalRef.current) clearInterval(intervalRef.current);

      if (hasRunning) {
        intervalRef.current = setInterval(() => {
          void fetchAllStatuses().then((updated) => {
            if (!updated) return;
            const stillRunning = [...updated.values()].some((s) => s === 'running');
            if (!stillRunning && intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          });
        }, POLL_INTERVAL_MS);
      }
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
