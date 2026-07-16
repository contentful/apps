import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useRunStorage } from '../../src/hooks/useRunStorage';
import type { RunRecord } from '../../src/types/runs';

const SPACE_ID = 'space-1';
const ENV_ID = 'env-1';
const STORAGE_KEY = `gdrive-import-runs::${SPACE_ID}::${ENV_ID}`;

const makeRecord = (overrides?: Partial<RunRecord>): RunRecord => ({
  runId: 'run-' + Math.random().toString(36).slice(2),
  documentTitle: 'Test Doc',
  documentId: 'doc-id',
  contentTypeIds: ['ct-1'],
  startedAt: new Date().toISOString(),
  ...overrides,
});

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('useRunStorage', () => {
  it('initialises with empty runs when localStorage is empty', () => {
    const { result } = renderHook(() => useRunStorage(SPACE_ID, ENV_ID));
    expect(result.current.runs).toEqual([]);
    expect(result.current.storageError).toBeNull();
  });

  it('initialises from existing localStorage data on mount', () => {
    const existing: RunRecord[] = [makeRecord({ runId: 'existing-1' })];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    const { result } = renderHook(() => useRunStorage(SPACE_ID, ENV_ID));
    expect(result.current.runs).toHaveLength(1);
    expect(result.current.runs[0].runId).toBe('existing-1');
  });

  it('addRun prepends and persists to localStorage', () => {
    const { result } = renderHook(() => useRunStorage(SPACE_ID, ENV_ID));
    const record = makeRecord({ runId: 'new-run' });

    act(() => result.current.addRun(record));

    expect(result.current.runs[0].runId).toBe('new-run');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as RunRecord[];
    expect(stored[0].runId).toBe('new-run');
  });

  it('addRun is idempotent on duplicate runId', () => {
    const { result } = renderHook(() => useRunStorage(SPACE_ID, ENV_ID));
    const record = makeRecord({ runId: 'dup-run' });

    act(() => result.current.addRun(record));
    act(() => result.current.addRun(record));

    expect(result.current.runs.filter((r) => r.runId === 'dup-run')).toHaveLength(1);
  });

  it('addRun prunes to 50 records when at capacity', () => {
    // Store 50 records: run-0 is most recent (index 0), run-49 is oldest (index 49)
    const existing = Array.from({ length: 50 }, (_, i) =>
      makeRecord({ runId: `run-${i}`, startedAt: new Date((50 - i) * 1000).toISOString() })
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    const { result } = renderHook(() => useRunStorage(SPACE_ID, ENV_ID));

    act(() => result.current.addRun(makeRecord({ runId: 'newest' })));

    expect(result.current.runs).toHaveLength(50);
    expect(result.current.runs[0].runId).toBe('newest');
    // last/oldest run (run-49) should be evicted
    expect(result.current.runs.find((r) => r.runId === 'run-49')).toBeUndefined();
    // most recent stored run (run-0) should be retained
    expect(result.current.runs.find((r) => r.runId === 'run-0')).toBeDefined();
  });

  it('removeRun removes the correct record', () => {
    const { result } = renderHook(() => useRunStorage(SPACE_ID, ENV_ID));
    const a = makeRecord({ runId: 'a' });
    const b = makeRecord({ runId: 'b' });

    act(() => result.current.addRun(a));
    act(() => result.current.addRun(b));
    act(() => result.current.removeRun('a'));

    expect(result.current.runs.find((r) => r.runId === 'a')).toBeUndefined();
    expect(result.current.runs.find((r) => r.runId === 'b')).toBeDefined();
  });

  it('markCompleted writes createdEntryIds without overwriting other fields', () => {
    const { result } = renderHook(() => useRunStorage(SPACE_ID, ENV_ID));
    const record = makeRecord({ runId: 'target', documentTitle: 'Keep me' });

    act(() => result.current.addRun(record));
    act(() => result.current.markCompleted('target', ['entry-1', 'entry-2']));

    const updated = result.current.runs.find((r) => r.runId === 'target');
    expect(updated?.createdEntryIds).toEqual(['entry-1', 'entry-2']);
    expect(updated?.documentTitle).toBe('Keep me');
  });

  it('key is scoped by spaceId + environmentId', () => {
    const { result: hook1 } = renderHook(() => useRunStorage('space-A', 'env-X'));
    const { result: hook2 } = renderHook(() => useRunStorage('space-B', 'env-X'));

    act(() => hook1.current.addRun(makeRecord({ runId: 'only-in-A' })));

    expect(hook2.current.runs.find((r) => r.runId === 'only-in-A')).toBeUndefined();
  });

  it('sets storageError when localStorage.setItem throws', () => {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('QuotaExceededError');
    });

    const { result } = renderHook(() => useRunStorage(SPACE_ID, ENV_ID));
    act(() => result.current.addRun(makeRecord()));

    expect(result.current.storageError).not.toBeNull();

    vi.restoreAllMocks();
    void originalSetItem;
  });
});
