import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PageAppSDK } from '@contentful/app-sdk';
import { getWorkflowRun, startAgentRun, resumeWorkflowRun } from '../../src/services/agents-api';
import { RunStatus, WorkflowFailureReason } from '@types';
import { createMockSDK } from '../mocks';

describe('agents-api', () => {
  let sdk: PageAppSDK;

  beforeEach(() => {
    sdk = createMockSDK() as PageAppSDK;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('getWorkflowRun', () => {
    it('returns run data with sys.id and status via sdk.cma.agentRun.get', async () => {
      const runData = {
        sys: { id: 'run-abc', status: RunStatus.IN_PROGRESS },
        metadata: { status: RunStatus.IN_PROGRESS },
      };
      vi.mocked(sdk.cma.agentRun.get).mockResolvedValue(runData as any);

      const result = await getWorkflowRun(sdk, 'space-1', 'master', 'run-abc');

      expect(sdk.cma.agentRun.get).toHaveBeenCalledWith({
        spaceId: 'space-1',
        environmentId: 'master',
        runId: 'run-abc',
      });
      expect(result?.sys?.id).toBe('run-abc');
      expect(result?.sys?.status).toBe(RunStatus.IN_PROGRESS);
    });

    it('returns null when run is not found (NotFound code)', async () => {
      const notFound = Object.assign(new Error('Not found'), { code: 'NotFound' });
      vi.mocked(sdk.cma.agentRun.get).mockRejectedValue(notFound);

      const result = await getWorkflowRun(sdk, 'space-1', 'master', 'missing-run');

      expect(result).toBeNull();
    });

    it('rethrows non-NotFound errors as normalised errors', async () => {
      vi.mocked(sdk.cma.agentRun.get).mockRejectedValue(new Error('Server exploded'));

      await expect(getWorkflowRun(sdk, 'space-1', 'master', 'run-bad')).rejects.toThrow(
        'Server exploded'
      );
    });

    it('returns PENDING_REVIEW status with suspendPayload intact', async () => {
      const suspendPayload = {
        suspendStepId: 'select-tabs-images-step' as const,
        documentId: 'doc-1',
      };
      const runData = {
        sys: { id: 'run-pr', status: RunStatus.PENDING_REVIEW },
        metadata: { status: RunStatus.PENDING_REVIEW, suspendPayload },
      };
      vi.mocked(sdk.cma.agentRun.get).mockResolvedValue(runData as any);

      const result = await getWorkflowRun(sdk, 'space-1', 'master', 'run-pr');

      expect(result?.sys?.status).toBe(RunStatus.PENDING_REVIEW);
      expect(result?.metadata?.suspendPayload).toEqual(suspendPayload);
    });

    it('returns COMPLETED status with googleDocPayload', async () => {
      const googleDocPayload = { entries: [], assets: [], referenceGraph: {} };
      const runData = {
        sys: { id: 'run-done', status: RunStatus.COMPLETED },
        metadata: { status: RunStatus.COMPLETED, googleDocPayload },
      };
      vi.mocked(sdk.cma.agentRun.get).mockResolvedValue(runData as any);

      const result = await getWorkflowRun(sdk, 'space-1', 'master', 'run-done');

      expect(result?.sys?.status).toBe(RunStatus.COMPLETED);
      expect(result?.metadata?.googleDocPayload).toEqual(googleDocPayload);
    });

    it('returns FAILED status with workflowFailure metadata', async () => {
      const workflowFailure = {
        code: WorkflowFailureReason.AI_SERVICE_UNAVAILABLE,
        message: 'AI unavailable',
      };
      const runData = {
        sys: { id: 'run-fail', status: RunStatus.FAILED },
        metadata: { status: RunStatus.FAILED, workflowFailure },
      };
      vi.mocked(sdk.cma.agentRun.get).mockResolvedValue(runData as any);

      const result = await getWorkflowRun(sdk, 'space-1', 'master', 'run-fail');

      expect(result?.sys?.status).toBe(RunStatus.FAILED);
      expect(result?.metadata?.workflowFailure?.code).toBe(
        WorkflowFailureReason.AI_SERVICE_UNAVAILABLE
      );
    });
  });

  describe('startAgentRun', () => {
    const payload = {
      messages: [{ role: 'user' as const, parts: [{ type: 'text' as const, text: 'analyze' }] }],
      metadata: { documentId: 'doc-1', contentTypeIds: ['blogPost'], oauthToken: 'token-x' },
      threadId: 'thread-1',
    };

    it('returns sys.id from the agent generate response', async () => {
      vi.mocked(sdk.cma.agent.generate).mockResolvedValue({
        sys: { id: 'run-new-123' },
      } as any);

      const runId = await startAgentRun(sdk, 'space-1', 'master', payload);

      expect(runId).toBe('run-new-123');
    });

    it('throws when generate response has no sys.id', async () => {
      vi.mocked(sdk.cma.agent.generate).mockResolvedValue({ sys: {} } as any);

      await expect(startAgentRun(sdk, 'space-1', 'master', payload)).rejects.toThrow(
        'Agent run started but no run ID was returned'
      );
    });

    it('rethrows generate errors as normalised errors', async () => {
      vi.mocked(sdk.cma.agent.generate).mockRejectedValue(new Error('Rate limited'));

      await expect(startAgentRun(sdk, 'space-1', 'master', payload)).rejects.toThrow(
        'Rate limited'
      );
    });
  });

  describe('resumeWorkflowRun', () => {
    const resumePayload = { includeImages: true };

    it('calls agentRun.resume with the correct params', async () => {
      vi.mocked(sdk.cma.agentRun.resume).mockResolvedValue(undefined as any);

      await resumeWorkflowRun(sdk, 'space-1', 'master', 'run-abc', resumePayload);

      expect(sdk.cma.agentRun.resume).toHaveBeenCalledWith(
        { spaceId: 'space-1', environmentId: 'master', runId: 'run-abc' },
        { resumePayload }
      );
    });

    it('rethrows resume errors as normalised errors', async () => {
      vi.mocked(sdk.cma.agentRun.resume).mockRejectedValue(new Error('Resume failed'));

      await expect(
        resumeWorkflowRun(sdk, 'space-1', 'master', 'run-abc', resumePayload)
      ).rejects.toThrow('Resume failed');
    });

    it('calls legacy resumeRun when resume is absent', async () => {
      const legacyResumeRun = vi.fn().mockResolvedValue(undefined);
      const sdkWithLegacy = {
        ...sdk,
        cma: {
          ...sdk.cma,
          agentRun: { resumeRun: legacyResumeRun },
        },
      } as unknown as PageAppSDK;

      await resumeWorkflowRun(sdkWithLegacy, 'space-1', 'master', 'run-abc', resumePayload);

      expect(legacyResumeRun).toHaveBeenCalledWith(
        { spaceId: 'space-1', environmentId: 'master', runId: 'run-abc' },
        { resumePayload }
      );
    });

    it('throws when neither resume nor resumeRun is available', async () => {
      const sdkNoResume = {
        ...sdk,
        cma: { ...sdk.cma, agentRun: {} },
      } as unknown as PageAppSDK;

      await expect(
        resumeWorkflowRun(sdkNoResume, 'space-1', 'master', 'run-abc', resumePayload)
      ).rejects.toThrow('Agent run resume is not available in the current SDK.');
    });
  });
});
