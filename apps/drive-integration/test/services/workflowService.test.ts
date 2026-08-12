import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resumeAndPollWorkflow } from '../../src/services/workflowService';
import { RunStatus, WorkflowRunError, WorkflowFailureReason } from '@types';
import { createMockSDK } from '../mocks';

const mockResumeWorkflowRun = vi.fn();
const mockGetWorkflowRun = vi.fn();

vi.mock('../../src/services/agents-api', () => ({
  resumeWorkflowRun: (...args: unknown[]) => mockResumeWorkflowRun(...args),
  getWorkflowRun: (...args: unknown[]) => mockGetWorkflowRun(...args),
}));

const mockSdk = createMockSDK() as any;

const makeSuspendPayload = () => ({
  suspendStepId: 'mapping-review' as const,
  documentId: 'doc-1',
  normalizedDocument: {
    documentId: 'doc-1',
    title: 'Test',
    designValues: [],
    contentBlocks: [],
    images: [],
    tables: [],
    assets: [],
  },
  entryBlockGraph: { entries: [], excludedSourceRefs: [] },
  referenceGraph: {},
  contentTypes: [],
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('resumeAndPollWorkflow', () => {
  it('calls resumeWorkflowRun with correct args', async () => {
    mockResumeWorkflowRun.mockResolvedValue(undefined);
    mockGetWorkflowRun.mockResolvedValue({
      sys: { id: 'run-1', status: RunStatus.PENDING_REVIEW },
      metadata: { suspendPayload: makeSuspendPayload() },
      messages: [],
    });

    await resumeAndPollWorkflow(mockSdk, 'run-1', {
      entryBlockGraph: { entries: [], excludedSourceRefs: [] },
    });

    expect(mockResumeWorkflowRun).toHaveBeenCalledWith(
      mockSdk,
      'test-space-id',
      'test-environment-id',
      'run-1',
      expect.objectContaining({ entryBlockGraph: expect.any(Object) })
    );
  });

  it('polls after resume and returns WorkflowRunResult on PENDING_REVIEW', async () => {
    mockResumeWorkflowRun.mockResolvedValue(undefined);
    mockGetWorkflowRun.mockResolvedValue({
      sys: { id: 'run-1', status: RunStatus.PENDING_REVIEW },
      metadata: { suspendPayload: makeSuspendPayload() },
      messages: [],
    });

    const result = await resumeAndPollWorkflow(mockSdk, 'run-1', {});

    expect(result.status).toBe(RunStatus.PENDING_REVIEW);
    expect(result.runId).toBe('run-1');
    expect(mockGetWorkflowRun).toHaveBeenCalled();
  });

  it('returns COMPLETED WorkflowRunResult', async () => {
    mockResumeWorkflowRun.mockResolvedValue(undefined);
    mockGetWorkflowRun.mockResolvedValue({
      sys: { id: 'run-1', status: RunStatus.COMPLETED },
      metadata: {
        googleDocPayload: { entries: [], assets: [], referenceGraph: {} },
      },
      messages: [],
    });

    const result = await resumeAndPollWorkflow(mockSdk, 'run-1', {});

    expect(result.status).toBe(RunStatus.COMPLETED);
  });

  it('throws WorkflowRunError on FAILED status', async () => {
    mockResumeWorkflowRun.mockResolvedValue(undefined);
    mockGetWorkflowRun.mockResolvedValue({
      sys: { id: 'run-1', status: RunStatus.FAILED },
      metadata: {
        workflowFailure: {
          code: WorkflowFailureReason.PROCESSING_TIMEOUT,
          message: 'Timed out',
        },
      },
      messages: [],
    });

    await expect(resumeAndPollWorkflow(mockSdk, 'run-1', {})).rejects.toBeInstanceOf(
      WorkflowRunError
    );
  });

  it('throws if resumeWorkflowRun itself throws', async () => {
    mockResumeWorkflowRun.mockRejectedValue(new Error('Network error'));

    await expect(resumeAndPollWorkflow(mockSdk, 'run-1', {})).rejects.toThrow('Network error');
  });
});
