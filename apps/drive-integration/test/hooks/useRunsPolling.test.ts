import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRunsPolling } from '../../src/hooks/useRunsPolling';
import { RunStatus } from '@types';
import { createMockSDK } from '../mocks';
import type { RunRecord } from '../../src/types/runs';

const mockGetWorkflowRun = vi.fn();

vi.mock('../../src/services/agents-api', () => ({
  getWorkflowRun: (...args: unknown[]) => mockGetWorkflowRun(...args),
}));

const mockSdk = createMockSDK() as any;

// Stable references — must NOT be created inside renderHook callbacks or they
// change on every re-render, causing fetchAllStatuses to recreate and loop.
const SINGLE_RUN: RunRecord[] = [
  {
    runId: 'run-1',
    documentTitle: 'Test',
    documentId: 'doc-1',
    contentTypeIds: ['ct-1'],
    startedAt: '2026-01-01T00:00:00.000Z',
  },
];
const THREE_RUNS: RunRecord[] = [
  {
    runId: 'run-1',
    documentTitle: 'Test',
    documentId: 'doc-1',
    contentTypeIds: ['ct-1'],
    startedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    runId: 'run-2',
    documentTitle: 'Test',
    documentId: 'doc-2',
    contentTypeIds: ['ct-1'],
    startedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    runId: 'run-3',
    documentTitle: 'Test',
    documentId: 'doc-3',
    contentTypeIds: ['ct-1'],
    startedAt: '2026-01-01T00:00:00.000Z',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useRunsPolling', () => {
  it('statusMap is empty before first fetch resolves', () => {
    mockGetWorkflowRun.mockResolvedValue({ sys: { status: RunStatus.COMPLETED } });
    const { result } = renderHook(() => useRunsPolling(SINGLE_RUN, mockSdk));
    expect(result.current.statusMap.size).toBe(0);
  });

  it('maps IN_PROGRESS to running', async () => {
    mockGetWorkflowRun.mockResolvedValue({ sys: { status: RunStatus.IN_PROGRESS } });
    const { result, unmount } = renderHook(() => useRunsPolling(SINGLE_RUN, mockSdk));
    await waitFor(() => expect(result.current.statusMap.get('run-1')).toBe('running'));
    unmount();
  });

  it('maps DRAFT to running', async () => {
    mockGetWorkflowRun.mockResolvedValue({ sys: { status: RunStatus.DRAFT } });
    const { result, unmount } = renderHook(() => useRunsPolling(SINGLE_RUN, mockSdk));
    await waitFor(() => expect(result.current.statusMap.get('run-1')).toBe('running'));
    unmount();
  });

  it('maps PENDING_REVIEW to needs-review', async () => {
    mockGetWorkflowRun.mockResolvedValue({ sys: { status: RunStatus.PENDING_REVIEW } });
    const { result } = renderHook(() => useRunsPolling(SINGLE_RUN, mockSdk));
    await waitFor(() => expect(result.current.statusMap.get('run-1')).toBe('needs-review'));
  });

  it('maps COMPLETED to completed', async () => {
    mockGetWorkflowRun.mockResolvedValue({ sys: { status: RunStatus.COMPLETED } });
    const { result } = renderHook(() => useRunsPolling(SINGLE_RUN, mockSdk));
    await waitFor(() => expect(result.current.statusMap.get('run-1')).toBe('completed'));
  });

  it('maps FAILED to failed', async () => {
    mockGetWorkflowRun.mockResolvedValue({
      sys: { status: RunStatus.FAILED },
      metadata: { workflowFailure: { code: 'generic', message: 'Something went wrong' } },
    });
    const { result } = renderHook(() => useRunsPolling(SINGLE_RUN, mockSdk));
    await waitFor(() => expect(result.current.statusMap.get('run-1')).toBe('failed'));
  });

  it('maps null response to expired only after MAX_CONSECUTIVE_NULLS consecutive misses', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockGetWorkflowRun.mockResolvedValue(null);

    const { result, unmount } = renderHook(() => useRunsPolling(SINGLE_RUN, mockSdk));

    // Let first fetch resolve (1 miss, not yet expired)
    await act(() => vi.runAllTicks());
    await act(() => Promise.resolve());
    expect(result.current.statusMap.get('run-1')).toBeUndefined();

    // Drive 4 more ticks (total 5 = MAX_CONSECUTIVE_NULLS)
    for (let i = 0; i < 4; i++) {
      await act(async () => {
        vi.advanceTimersByTime(10_000);
        await vi.runAllTicks();
        await Promise.resolve();
      });
    }

    await waitFor(() => expect(result.current.statusMap.get('run-1')).toBe('expired'));

    unmount();
    vi.useRealTimers();
  });

  it('populates errorMap for failed runs', async () => {
    mockGetWorkflowRun.mockResolvedValue({
      sys: { status: RunStatus.FAILED },
      metadata: { workflowFailure: { code: 'generic', message: 'Failure detail' } },
    });
    const { result } = renderHook(() => useRunsPolling(SINGLE_RUN, mockSdk));
    await waitFor(() => expect(result.current.errorMap.get('run-1')).toBe('Failure detail'));
  });

  it('fetches all runs in parallel (Promise.all fires all before any await)', () => {
    let callCount = 0;
    mockGetWorkflowRun.mockImplementation(() => {
      callCount++;
      return Promise.resolve({ sys: { status: RunStatus.COMPLETED } });
    });

    renderHook(() => useRunsPolling(THREE_RUNS, mockSdk));

    // All 3 calls should have been initiated synchronously by Promise.all
    expect(callCount).toBe(3);
  });

  it('does not re-fetch after settling when all runs complete', async () => {
    mockGetWorkflowRun.mockResolvedValue({ sys: { status: RunStatus.COMPLETED } });
    renderHook(() => useRunsPolling(SINGLE_RUN, mockSdk));

    await waitFor(() => expect(mockGetWorkflowRun.mock.calls.length).toBeGreaterThanOrEqual(1));

    // Give time for any spurious re-fetches to occur
    await new Promise((r) => setTimeout(r, 50));

    // Only the initial fetch, no repeated polling
    expect(mockGetWorkflowRun.mock.calls.length).toBe(1);
  });
});
