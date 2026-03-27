import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RunStatus } from '../../src/utils/types';
import { useWorkflowAgent } from '../../src/hooks/useWorkflowAgent';

const mockStartAgentRun = vi.fn();
const mockGetWorkflowRun = vi.fn();
const mockResumeWorkflowRun = vi.fn();

vi.mock('../../src/services/agents-api', () => ({
  startAgentRun: (...args: unknown[]) => mockStartAgentRun(...args),
  getWorkflowRun: (...args: unknown[]) => mockGetWorkflowRun(...args),
  resumeWorkflowRun: (...args: unknown[]) => mockResumeWorkflowRun(...args),
}));

describe('useWorkflowAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extracts preview title from normalizedDocument in tool invocation result', async () => {
    mockStartAgentRun.mockResolvedValue('run-123');
    mockGetWorkflowRun.mockResolvedValue({
      sys: { status: RunStatus.COMPLETED },
      metadata: { status: RunStatus.COMPLETED },
      messages: [
        {
          role: 'assistant',
          content: {
            parts: [
              { type: 'step-start' },
              {
                type: 'tool-invocation',
                toolInvocation: {
                  result: {
                    result: {
                      normalizedDocument: {
                        title: 'Positioned Object Example',
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    });

    const sdk = {
      ids: {
        space: 'space-id',
        environment: 'env-id',
      },
    };

    const { result } = renderHook(() =>
      useWorkflowAgent({
        sdk: sdk as never,
        documentId: 'doc-id-1',
        oauthToken: 'oauth-token',
      })
    );

    let workflowResult;
    await act(async () => {
      workflowResult = await result.current.startWorkflow(['blogPost']);
    });

    expect(workflowResult).toMatchObject({
      status: RunStatus.COMPLETED,
      runId: 'run-123',
      previewPayload: {
        title: 'Positioned Object Example',
      },
    });
  });
});
