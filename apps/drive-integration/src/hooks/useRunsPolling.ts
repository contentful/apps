import { useState, useEffect, useRef, useCallback } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { RunStatus } from '@types';
import { getWorkflowRun, AgentRunData } from '../services/agents-api';
import { DisplayStatus } from '../types/runs';
import type { RunRecord } from '../types/runs';

const POLL_INTERVAL_MS = 10_000;

const RUN_STATUS_TO_DISPLAY: Partial<Record<RunStatus, DisplayStatus>> = {
  [RunStatus.IN_PROGRESS]: DisplayStatus.RUNNING,
  [RunStatus.DRAFT]: DisplayStatus.RUNNING,
  [RunStatus.PENDING_REVIEW]: DisplayStatus.NEEDS_REVIEW,
  [RunStatus.COMPLETED]: DisplayStatus.COMPLETED,
  [RunStatus.FAILED]: DisplayStatus.FAILED,
};

function toDisplayStatus(runData: AgentRunData | null): DisplayStatus {
  if (!runData) return DisplayStatus.EXPIRED;
  const status = runData.sys?.status ?? runData.metadata?.status;
  return (status && RUN_STATUS_TO_DISPLAY[status]) ?? DisplayStatus.EXPIRED;
}

function extractErrorMessage(runData: AgentRunData | null): string | undefined {
  return runData?.metadata?.workflowFailure?.message;
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

  useEffect(() => {
    void fetchAllStatuses().then((nextStatus) => {
      if (!nextStatus) return;
      const hasRunning = [...nextStatus.values()].some((s) => s === DisplayStatus.RUNNING);

      if (intervalRef.current) clearInterval(intervalRef.current);

      if (hasRunning) {
        intervalRef.current = setInterval(() => {
          void fetchAllStatuses().then((updated) => {
            if (!updated) return;
            const stillRunning = [...updated.values()].some((s) => s === DisplayStatus.RUNNING);
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
