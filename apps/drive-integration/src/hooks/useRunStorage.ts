import { useState, useCallback } from 'react';
import type { RunRecord } from '../types/runs';

const MAX_RUNS = 50;

function makeKey(spaceId: string, environmentId: string): string {
  return `gdrive-import-runs::${spaceId}::${environmentId}`;
}

function readFromStorage(key: string): RunRecord[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as RunRecord[];
  } catch {
    return [];
  }
}

function writeToStorage(key: string, records: RunRecord[]): void {
  localStorage.setItem(key, JSON.stringify(records));
}

export interface UseRunStorage {
  runs: RunRecord[];
  addRun(record: RunRecord): void;
  removeRun(runId: string): void;
  retryRun(oldRunId: string, newRecord: RunRecord): void;
  markCompleted(runId: string, entryIds: string[]): void;
  storageError: string | null;
}

export function useRunStorage(spaceId: string, environmentId: string): UseRunStorage {
  const key = makeKey(spaceId, environmentId);
  const [runs, setRuns] = useState<RunRecord[]>(() => readFromStorage(key));
  const [storageError, setStorageError] = useState<string | null>(null);

  const persist = useCallback(
    (next: RunRecord[]) => {
      try {
        writeToStorage(key, next);
        setStorageError(null);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Unable to save import history. Storage may be full.';
        setStorageError(msg);
      }
      setRuns(next);
    },
    [key]
  );

  const addRun = useCallback(
    (record: RunRecord) => {
      setRuns((current) => {
        if (current.some((r) => r.runId === record.runId)) return current;
        const next = [record, ...current];
        if (next.length > MAX_RUNS) next.splice(MAX_RUNS);
        try {
          writeToStorage(key, next);
          setStorageError(null);
        } catch (err) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Unable to save import history. Storage may be full.';
          setStorageError(msg);
        }
        return next;
      });
    },
    [key]
  );

  const removeRun = useCallback(
    (runId: string) => {
      setRuns((current) => {
        const next = current.filter((r) => r.runId !== runId);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const retryRun = useCallback(
    (oldRunId: string, newRecord: RunRecord) => {
      setRuns((current) => {
        const next = current.map((r) => (r.runId === oldRunId ? newRecord : r));
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const markCompleted = useCallback(
    (runId: string, entryIds: string[]) => {
      setRuns((current) => {
        const next = current.map((r) =>
          r.runId === runId ? { ...r, createdEntryIds: entryIds } : r
        );
        persist(next);
        return next;
      });
    },
    [persist]
  );

  return { runs, addRun, removeRun, retryRun, markCompleted, storageError };
}
