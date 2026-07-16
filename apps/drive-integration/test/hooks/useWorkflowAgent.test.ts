import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWorkflowAgent } from '../../src/hooks/useWorkflowAgent';
import { createMockSDK } from '../mocks';

const mockStartAgentRun = vi.fn();
const mockPollAgentRun = vi.fn();

vi.mock('../../src/services/agents-api', () => ({
  startAgentRun: (...args: unknown[]) => mockStartAgentRun(...args),
  getWorkflowRun: vi.fn(),
}));

vi.mock('../../src/services/workflowService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/workflowService')>();
  return {
    ...actual,
    pollAgentRun: (...args: unknown[]) => mockPollAgentRun(...args),
  };
});

const mockSdk = createMockSDK() as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useWorkflowAgent', () => {
  it('startWorkflow calls startAgentRun and returns runId string', async () => {
    mockStartAgentRun.mockResolvedValue('run-abc-123');

    const { result } = renderHook(() =>
      useWorkflowAgent({ sdk: mockSdk, documentId: 'doc-1', oauthToken: 'token' })
    );

    let returnedRunId: string | undefined;
    await act(async () => {
      returnedRunId = await result.current.startWorkflow(['ct-1'], {
        includeImages: false,
        selectedTabIds: [],
      });
    });

    expect(mockStartAgentRun).toHaveBeenCalledOnce();
    expect(returnedRunId).toBe('run-abc-123');
  });

  it('startWorkflow does NOT call pollAgentRun', async () => {
    mockStartAgentRun.mockResolvedValue('run-abc-123');

    const { result } = renderHook(() =>
      useWorkflowAgent({ sdk: mockSdk, documentId: 'doc-1', oauthToken: 'token' })
    );

    await act(async () => {
      await result.current.startWorkflow(['ct-1'], { includeImages: false, selectedTabIds: [] });
    });

    expect(mockPollAgentRun).not.toHaveBeenCalled();
  });

  it('isAnalyzing is true during startWorkflow and false after', async () => {
    let resolveRun: (v: string) => void;
    mockStartAgentRun.mockReturnValue(
      new Promise<string>((resolve) => {
        resolveRun = resolve;
      })
    );

    const { result } = renderHook(() =>
      useWorkflowAgent({ sdk: mockSdk, documentId: 'doc-1', oauthToken: 'token' })
    );

    expect(result.current.isAnalyzing).toBe(false);

    let workflowPromise: Promise<string>;
    act(() => {
      workflowPromise = result.current.startWorkflow(['ct-1'], {
        includeImages: false,
        selectedTabIds: [],
      });
    });

    expect(result.current.isAnalyzing).toBe(true);

    await act(async () => {
      resolveRun!('run-xyz');
      await workflowPromise!;
    });

    expect(result.current.isAnalyzing).toBe(false);
  });

  it('startWorkflow throws if startAgentRun throws', async () => {
    mockStartAgentRun.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      useWorkflowAgent({ sdk: mockSdk, documentId: 'doc-1', oauthToken: 'token' })
    );

    await expect(
      act(() =>
        result.current.startWorkflow(['ct-1'], { includeImages: false, selectedTabIds: [] })
      )
    ).rejects.toThrow('Network error');

    expect(result.current.isAnalyzing).toBe(false);
  });
});
