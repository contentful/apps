import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PageAppSDK } from '@contentful/app-sdk';
import { useWorkflowAgent } from '@hooks/useWorkflowAgent';
import { RunStatus, WorkflowFailureReason } from '@types';
import { createMockSDK } from '../mocks';

// Minimal valid googleDocPayload that passes validatePayloadShape
const COMPLETED_PAYLOAD = { entries: [], assets: [], referenceGraph: {} };

const MAPPING_SUSPEND_PAYLOAD = {
  suspendStepId: 'mapping-review' as const,
  documentId: 'doc-1',
  normalizedDocument: {
    documentId: 'doc-1',
    title: 'Test doc',
    designValues: [],
    contentBlocks: [],
    images: [],
    tables: [],
    assets: [],
  },
  entryBlockGraph: { entries: [], excludedSourceRefs: [] },
  referenceGraph: {},
  contentTypes: [],
};

function makeRun(status: RunStatus, extra: Record<string, unknown> = {}) {
  return {
    sys: { id: 'run-123', status },
    metadata: { status, ...extra },
  };
}

describe('useWorkflowAgent — workflow orchestration', () => {
  let sdk: PageAppSDK;

  beforeEach(() => {
    sdk = createMockSDK() as PageAppSDK;
    vi.useFakeTimers();

    // Default: generate returns a run ID
    vi.mocked(sdk.cma.agent.generate).mockResolvedValue({ sys: { id: 'run-123' } } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // Helper: renders the hook and kicks off startWorkflow, advancing timers
  // between each queued agentRun.get response.
  async function drivePolling(mockResponses: ReturnType<typeof makeRun>[]) {
    const { result } = renderHook(() =>
      useWorkflowAgent({ sdk, documentId: 'doc-1', oauthToken: 'token-x' })
    );

    let callIndex = 0;
    vi.mocked(sdk.cma.agentRun.get).mockImplementation(async () => {
      const response = mockResponses[Math.min(callIndex, mockResponses.length - 1)];
      callIndex++;
      return response as any;
    });

    let resultPromise: Promise<any>;
    act(() => {
      resultPromise = result.current.startWorkflow(['blogPost']);
      // Attach a no-op catch immediately so Node doesn't flag the rejection as
      // unhandled between the act() call and the rejects assertion below.
      void resultPromise.catch(() => {});
    });

    // Advance timers for each poll interval needed
    for (let i = 0; i < mockResponses.length; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10_000);
      });
    }

    return resultPromise!;
  }

  async function driveResume(
    runId: string,
    resumePayload: Record<string, unknown>,
    mockResponses: ReturnType<typeof makeRun>[]
  ) {
    const { result } = renderHook(() =>
      useWorkflowAgent({ sdk, documentId: 'doc-1', oauthToken: 'token-x' })
    );

    let callIndex = 0;
    vi.mocked(sdk.cma.agentRun.get).mockImplementation(async () => {
      const response = mockResponses[Math.min(callIndex, mockResponses.length - 1)];
      callIndex++;
      return response as any;
    });

    let resultPromise: Promise<any>;
    act(() => {
      resultPromise = result.current.resumeWorkflow(runId, resumePayload);
      void resultPromise.catch(() => {});
    });

    for (let i = 0; i < mockResponses.length; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10_000);
      });
    }

    return resultPromise!;
  }

  describe('startWorkflow', () => {
    it('polls until COMPLETED and returns the googleDocPayload', async () => {
      const responses = [
        makeRun(RunStatus.IN_PROGRESS),
        makeRun(RunStatus.IN_PROGRESS),
        makeRun(RunStatus.COMPLETED, { googleDocPayload: COMPLETED_PAYLOAD }),
      ];

      const result = await drivePolling(responses);

      expect(result.status).toBe(RunStatus.COMPLETED);
      expect(result.googleDocPayload).toEqual(COMPLETED_PAYLOAD);
      expect(result.runId).toBe('run-123');
    });

    it('polls through IN_PROGRESS and resolves on PENDING_REVIEW with suspendPayload', async () => {
      const TABS_SUSPEND_PAYLOAD = {
        suspendStepId: 'select-tabs-images-step' as const,
        documentId: 'doc-1',
      };
      const responses = [
        makeRun(RunStatus.IN_PROGRESS),
        makeRun(RunStatus.PENDING_REVIEW, { suspendPayload: TABS_SUSPEND_PAYLOAD }),
      ];

      const result = await drivePolling(responses);

      expect(result.status).toBe(RunStatus.PENDING_REVIEW);
      expect(result.suspendPayload).toEqual(TABS_SUSPEND_PAYLOAD);
    });

    it('retries when PENDING_REVIEW arrives without suspendPayload, then resolves when payload flushes', async () => {
      // First 3 polls: PENDING_REVIEW with no suspendPayload (backend flush delay)
      // 4th poll: suspendPayload arrives
      const responses = [
        makeRun(RunStatus.IN_PROGRESS),
        makeRun(RunStatus.PENDING_REVIEW), // no suspendPayload
        makeRun(RunStatus.PENDING_REVIEW), // no suspendPayload
        makeRun(RunStatus.PENDING_REVIEW), // no suspendPayload
        makeRun(RunStatus.PENDING_REVIEW, { suspendPayload: MAPPING_SUSPEND_PAYLOAD }),
      ];

      const result = await drivePolling(responses);

      expect(result.status).toBe(RunStatus.PENDING_REVIEW);
      expect(result.suspendPayload).toEqual(MAPPING_SUSPEND_PAYLOAD);
      expect(sdk.cma.agentRun.get).toHaveBeenCalledTimes(5);
    });

    it('throws WorkflowRunError when PENDING_REVIEW missing payload exceeds retry limit', async () => {
      // MAX_PENDING_REVIEW_MISSING_PAYLOAD_RETRIES = 5, so 6 consecutive missing = throw
      const responses = Array(7).fill(makeRun(RunStatus.PENDING_REVIEW)); // never gets payload

      await expect(drivePolling(responses)).rejects.toThrow(
        'Workflow paused for review, but suspend payload was missing.'
      );
    });

    it('throws WorkflowRunError with correct reason on FAILED status', async () => {
      const responses = [
        makeRun(RunStatus.IN_PROGRESS),
        makeRun(RunStatus.FAILED, {
          workflowFailure: {
            code: WorkflowFailureReason.GOOGLE_DRIVE_AUTH_EXPIRED,
            message: 'OAuth expired',
          },
        }),
      ];

      const promise = drivePolling(responses);
      await expect(promise).rejects.toMatchObject({
        name: 'WorkflowRunError',
        reason: WorkflowFailureReason.GOOGLE_DRIVE_AUTH_EXPIRED,
      });
    });

    it('throws WorkflowRunError with GENERIC reason for unknown failure codes', async () => {
      const responses = [
        makeRun(RunStatus.FAILED, {
          workflowFailure: { code: 'some-unknown-code', message: 'Unknown' },
        }),
      ];

      const promise = drivePolling(responses);
      await expect(promise).rejects.toMatchObject({
        name: 'WorkflowRunError',
        reason: WorkflowFailureReason.GENERIC,
      });
    });

    it('throws WorkflowRunError with PROCESSING_TIMEOUT after max poll attempts', async () => {
      // Always returns IN_PROGRESS so polling exhausts MAX_POLL_ATTEMPTS (120)
      vi.mocked(sdk.cma.agentRun.get).mockResolvedValue(makeRun(RunStatus.IN_PROGRESS) as any);

      const { result } = renderHook(() =>
        useWorkflowAgent({ sdk, documentId: 'doc-1', oauthToken: 'token-x' })
      );

      let resultPromise: Promise<any>;
      act(() => {
        resultPromise = result.current.startWorkflow(['blogPost']);
        void resultPromise.catch(() => {});
      });

      // Advance past all 120 poll attempts (120 × 10s = 1200s)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_210_000);
      });

      await expect(resultPromise!).rejects.toMatchObject({
        name: 'WorkflowRunError',
        reason: WorkflowFailureReason.PROCESSING_TIMEOUT,
      });
    });

    it('handles a run that is initially not found, then appears', async () => {
      let callCount = 0;
      vi.mocked(sdk.cma.agentRun.get).mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          const err = Object.assign(new Error('Not found'), { code: 'NotFound' });
          throw err;
        }
        return makeRun(RunStatus.COMPLETED, { googleDocPayload: COMPLETED_PAYLOAD }) as any;
      });

      const { result } = renderHook(() =>
        useWorkflowAgent({ sdk, documentId: 'doc-1', oauthToken: 'token-x' })
      );

      let resultPromise: Promise<any>;
      act(() => {
        resultPromise = result.current.startWorkflow(['blogPost']);
      });

      for (let i = 0; i < 3; i++) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(10_000);
        });
      }

      const workflowResult = await resultPromise!;
      expect(workflowResult.status).toBe(RunStatus.COMPLETED);
    });

    it('sets isAnalyzing to true while running and false when done', async () => {
      vi.mocked(sdk.cma.agentRun.get).mockResolvedValue(
        makeRun(RunStatus.COMPLETED, { googleDocPayload: COMPLETED_PAYLOAD }) as any
      );

      const { result } = renderHook(() =>
        useWorkflowAgent({ sdk, documentId: 'doc-1', oauthToken: 'token-x' })
      );

      expect(result.current.isAnalyzing).toBe(false);

      let resultPromise: Promise<any>;
      act(() => {
        resultPromise = result.current.startWorkflow(['blogPost']);
      });

      expect(result.current.isAnalyzing).toBe(true);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(10_000);
      });

      await resultPromise!;
      expect(result.current.isAnalyzing).toBe(false);
    });
  });

  describe('resumeWorkflow', () => {
    beforeEach(() => {
      vi.mocked(sdk.cma.agentRun.resume).mockResolvedValue(undefined as any);
    });

    it('resumes a run and polls to COMPLETED', async () => {
      const responses = [
        makeRun(RunStatus.IN_PROGRESS),
        makeRun(RunStatus.COMPLETED, { googleDocPayload: COMPLETED_PAYLOAD }),
      ];

      const workflowResult = await driveResume('run-123', { includeImages: true }, responses);

      expect(sdk.cma.agentRun.resume).toHaveBeenCalledWith(
        expect.objectContaining({ runId: 'run-123' }),
        { resumePayload: { includeImages: true } }
      );
      expect(workflowResult.status).toBe(RunStatus.COMPLETED);
    });

    it('resumes a mapping-review step and polls to a second PENDING_REVIEW with new suspendPayload', async () => {
      const responses = [
        makeRun(RunStatus.IN_PROGRESS),
        makeRun(RunStatus.PENDING_REVIEW, { suspendPayload: MAPPING_SUSPEND_PAYLOAD }),
      ];

      const workflowResult = await driveResume(
        'run-123',
        { entryBlockGraph: { entries: [], excludedSourceRefs: [] } },
        responses
      );

      expect(workflowResult.status).toBe(RunStatus.PENDING_REVIEW);
      expect(workflowResult.suspendPayload).toEqual(MAPPING_SUSPEND_PAYLOAD);
    });

    it('handles cancellation resume payload and returns COMPLETED', async () => {
      const responses = [
        makeRun(RunStatus.COMPLETED, { googleDocPayload: { cancelled: true, documentId: 'doc-1' } }),
      ];

      const workflowResult = await driveResume('run-123', { cancelled: true }, responses);

      expect(workflowResult.status).toBe(RunStatus.COMPLETED);
      // Cancelled runs produce an empty payload — no entries or assets
      expect(workflowResult.googleDocPayload.entries).toEqual([]);
    });

    it('throws if resume API call fails', async () => {
      vi.mocked(sdk.cma.agentRun.resume).mockRejectedValue(new Error('Resume rejected'));

      await expect(
        driveResume('run-123', { includeImages: false }, [makeRun(RunStatus.IN_PROGRESS)])
      ).rejects.toThrow('Resume rejected');
    });
  });
});
