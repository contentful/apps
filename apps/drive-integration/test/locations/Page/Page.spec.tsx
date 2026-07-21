import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMockSDK } from '../../mocks';
import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest';
import React from 'react';
import type { MappingReviewSuspendPayload } from '@types';
import Page from '../../../src/locations/Page/Page';

const mockSdk = createMockSDK();

const { mockResumeAndPollWorkflow, mockMarkCompleted, mockResetFlow, mappingReviewPayloadMock } =
  vi.hoisted(() => {
    const payload: MappingReviewSuspendPayload = {
      suspendStepId: 'mapping-review',
      reason: 'Mapping review required',
      documentId: 'doc-test',
      documentTitle: 'Document mapping review',
      normalizedDocument: {
        documentId: 'doc-test',
        title: 'Document mapping review',
        designValues: [],
        contentBlocks: [],
        images: [],
        tables: [],
        assets: [],
      },
      entryBlockGraph: { entries: [], excludedSourceRefs: [] },
      referenceGraph: {
        edges: [],
        creationOrder: [],
        deferredFields: [],
        hasCircularDependency: false,
      },
      contentTypes: [],
    };
    return {
      mockResumeAndPollWorkflow: vi.fn(),
      mockMarkCompleted: vi.fn(),
      mockResetFlow: vi.fn(),
      mappingReviewPayloadMock: payload,
    };
  });

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

vi.mock('../../../src/locations/Page/components/mainpage/OAuthConnector', () => ({
  OAuthConnector: () => <div>Mock OAuth Connector</div>,
}));

vi.mock('../../../src/services/workflowService', () => ({
  resumeAndPollWorkflow: (...args: unknown[]) => mockResumeAndPollWorkflow(...args),
}));

vi.mock('../../../src/hooks/useRunStorage', () => ({
  useRunStorage: () => ({
    runs: [],
    addRun: vi.fn(),
    removeRun: vi.fn(),
    markCompleted: mockMarkCompleted,
    storageError: null,
  }),
}));

vi.mock('../../../src/hooks/useRunsPolling', () => ({
  useRunsPolling: () => ({
    statusMap: new Map(),
    errorMap: new Map(),
    titleMap: new Map(),
  }),
}));

vi.mock('../../../src/services/agents-api', () => ({
  getWorkflowRun: vi.fn().mockResolvedValue({
    sys: { status: 'PENDING_REVIEW' },
    metadata: { suspendPayload: mappingReviewPayloadMock },
  }),
}));

vi.mock('../../../src/locations/Page/components/review/ReviewPage', () => ({
  ReviewPage: ({
    payload,
    runId,
    onCancelReview,
    onExitReview,
    onRunCompleted,
  }: {
    payload: MappingReviewSuspendPayload;
    runId: string;
    onCancelReview: () => Promise<void>;
    onExitReview: () => void;
    onRunCompleted: (entryIds: string[]) => void;
  }) => (
    <div>
      <div>{`Mock review page for ${payload.documentTitle} run:${runId}`}</div>
      <button onClick={() => void onCancelReview()} type="button">
        Trigger review cancel
      </button>
      <button onClick={onExitReview} type="button">
        Trigger review exit
      </button>
      <button onClick={() => onRunCompleted(['entry-1', 'entry-2'])} type="button">
        Trigger run completed
      </button>
    </div>
  ),
}));

const { mockModalOrchestrator } = vi.hoisted(() => ({
  mockModalOrchestrator: vi.fn(),
}));

vi.mock('../../../src/locations/Page/components/mainpage/ModalOrchestrator', () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ModalOrchestrator: require('react').forwardRef(
    (
      props: {
        onAiAccessDenied: (message: string) => void;
        onRunStarted: (runId: string) => void;
        oauthToken: string;
      },
      ref: React.ForwardedRef<{ startFlow: () => void; resetFlow: () => void }>
    ) => {
      const handle = { startFlow: vi.fn(), resetFlow: mockResetFlow };
      if (typeof ref === 'function') ref(handle);
      else if (ref) ref.current = handle;

      mockModalOrchestrator(props);
      return (
        <>
          <button onClick={() => props.onRunStarted('run-123')} type="button">
            Trigger Run Started
          </button>
          <button onClick={() => props.onRunStarted('reset')} type="button">
            Trigger Reset To Main
          </button>
          <button
            onClick={() => props.onAiAccessDenied('AI features are currently disabled')}
            type="button">
            Trigger Modal AI Access Denied
          </button>
        </>
      );
    }
  ),
}));

vi.mock('../../../src/hooks/useGoogleDocsAgentFlags', () => ({
  useGoogleDocsAgentFlags: () => ({
    'google-docs-async-runs': true,
    'google-docs-agent-improvements': false,
  }),
}));

vi.mock('../../../src/locations/Page/components/runs/RunsPage', () => ({
  RunsPage: ({
    onStartImport,
    onReviewRun,
  }: {
    onStartImport: () => void;
    onReviewRun: (runId: string) => void;
  }) => (
    <div>
      <div>Runs Page</div>
      <button onClick={onStartImport} type="button">
        Select file
      </button>
      <button onClick={() => onReviewRun('run-123')} type="button">
        Review run-123
      </button>
    </div>
  ),
}));

describe('Page component', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockResumeAndPollWorkflow.mockResolvedValue({});
  });

  it('renders RunsPage by default on mount', async () => {
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText('Runs Page')).toBeTruthy();
    });
  });

  it('onStartImport opens the modal flow (RunsPage remains visible)', async () => {
    render(<Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Select file' }));
    await waitFor(() => {
      expect(screen.getByText('Runs Page')).toBeTruthy();
    });
  });

  it('onRunStarted callback keeps runs view visible', async () => {
    render(<Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Trigger Run Started' }));
    await waitFor(() => {
      expect(screen.getByText('Runs Page')).toBeTruthy();
    });
  });

  it('onReviewRun transitions to review view (loading spinner, then ReviewPage)', async () => {
    render(<Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Review run-123' }));
    await waitFor(() => {
      expect(
        screen.getByText('Mock review page for Document mapping review run:run-123')
      ).toBeTruthy();
    });
  });

  it('onExitReview callback transitions back to runs view', async () => {
    render(<Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Review run-123' }));
    await waitFor(() =>
      screen.getByText('Mock review page for Document mapping review run:run-123')
    );

    fireEvent.click(screen.getByRole('button', { name: 'Trigger review exit' }));
    await waitFor(() => {
      expect(screen.getByText('Runs Page')).toBeTruthy();
    });
    expect(mockResetFlow).toHaveBeenCalled();
  });

  it('onRunCompleted calls markCompleted with correct args', async () => {
    render(<Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Review run-123' }));
    await waitFor(() =>
      screen.getByText('Mock review page for Document mapping review run:run-123')
    );

    fireEvent.click(screen.getByRole('button', { name: 'Trigger run completed' }));
    await waitFor(() => {
      expect(mockMarkCompleted).toHaveBeenCalledWith('run-123', ['entry-1', 'entry-2']);
    });
  });

  it('onCancelReview calls resumeAndPollWorkflow and returns to runs', async () => {
    render(<Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Review run-123' }));
    await waitFor(() =>
      screen.getByText('Mock review page for Document mapping review run:run-123')
    );

    fireEvent.click(screen.getByRole('button', { name: 'Trigger review cancel' }));
    await waitFor(() => {
      expect(mockResumeAndPollWorkflow).toHaveBeenCalledWith(
        expect.anything(),
        'run-123',
        expect.objectContaining({ cancelled: true })
      );
      expect(screen.getByText('Runs Page')).toBeTruthy();
    });
  });

  it('aiAccessDeniedMessage blocks all views with warning note', async () => {
    render(<Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Trigger Modal AI Access Denied' }));
    await waitFor(() => {
      expect(screen.getByText(/AI features are currently disabled/)).toBeTruthy();
    });
  });

  it('Trigger Reset To Main returns to runs view', async () => {
    render(<Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Trigger Reset To Main' }));
    await waitFor(() => {
      expect(screen.getByText('Runs Page')).toBeTruthy();
    });
  });
});
