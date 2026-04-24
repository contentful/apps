import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { mockSdk } from '../../mocks';
import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest';
import React from 'react';
import type { MappingReviewSuspendPayload } from '@types';
import Page from '../../../src/locations/Page/Page';

const mappingReviewPayloadMock: MappingReviewSuspendPayload = {
  suspendStepId: 'mapping-review',
  reason: 'Mapping review required before CMA payload generation continues',
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
  entryBlockGraph: {
    entries: [],
    excludedSourceRefs: [],
  },
  referenceGraph: {
    edges: [],
    creationOrder: [],
    deferredFields: [],
    hasCircularDependency: false,
  },
  contentTypes: [],
};

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

vi.mock('../../../src/locations/Page/components/mainpage/OAuthConnector', () => ({
  OAuthConnector: () => <div>Mock OAuth Connector</div>,
}));

const { mockModalOrchestrator, mockResumeWorkflow, mockResetFlow } = vi.hoisted(() => ({
  mockModalOrchestrator: vi.fn(),
  mockResumeWorkflow: vi.fn(),
  mockResetFlow: vi.fn(),
}));

vi.mock('@hooks/useWorkflowAgent', () => ({
  useWorkflowAgent: () => ({
    resumeWorkflow: mockResumeWorkflow,
  }),
}));

vi.mock('../../../src/locations/Page/components/review/ReviewPage', () => ({
  ReviewPage: ({
    payload,
    onCancelReview,
    onExitReview,
  }: {
    payload: MappingReviewSuspendPayload;
    onCancelReview: () => Promise<void>;
    onExitReview: () => void;
  }) => (
    <div>
      <div>{`Mock review page for ${payload.documentTitle}`}</div>
      <button onClick={() => void onCancelReview()} type="button">
        Trigger review cancel
      </button>
      <button onClick={onExitReview} type="button">
        Trigger review exit
      </button>
    </div>
  ),
}));

vi.mock('../../../src/locations/Page/components/mainpage/ModalOrchestrator', () => ({
  ModalOrchestrator: require('react').forwardRef(
    (
      props: {
        onMappingReviewReady: (payload: MappingReviewSuspendPayload, runId: string) => void;
        onResetToMain: () => void;
        oauthToken: string;
      },
      ref: React.ForwardedRef<{
        startFlow: () => void;
        resetFlow: () => void;
      }>
    ) => {
      const handle = {
        startFlow: vi.fn(),
        resetFlow: mockResetFlow,
      };
      if (typeof ref === 'function') {
        ref(handle);
      } else if (ref) {
        ref.current = handle;
      }

      mockModalOrchestrator(props);
      return (
        <>
          <button
            onClick={() => props.onMappingReviewReady(mappingReviewPayloadMock, 'run-123')}
            type="button">
            Trigger Mapping Review Ready
          </button>
          <button onClick={props.onResetToMain} type="button">
            Trigger Reset To Main
          </button>
        </>
      );
    }
  ),
}));

describe('Page component', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockResumeWorkflow.mockResolvedValue({});
  });

  it('renders MainPageView by default', async () => {
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Drive Integration' })).toBeTruthy();
      expect(screen.queryByText(/Create from document "Selected document"/)).toBeNull();
    });
  });

  it('returns to main view when flow reset is requested by modal orchestrator', async () => {
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Drive Integration' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Mapping Review Ready' }));
    await waitFor(() => {
      expect(screen.getByText('Mock review page for Document mapping review')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Reset To Main' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Drive Integration' })).toBeTruthy();
      expect(screen.queryByText(/Create from document "Selected document"/)).toBeNull();
    });
  });

  it('switches to the mapping review screen when the workflow pauses for mapping review', async () => {
    render(<Page />);

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Mapping Review Ready' }));

    await waitFor(() => {
      expect(screen.getByText('Mock review page for Document mapping review')).toBeTruthy();
      expect(screen.queryByRole('heading', { name: 'Drive Integration' })).toBeNull();
    });
  });

  it('returns to the main view when exiting the review page after creation', async () => {
    render(<Page />);

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Mapping Review Ready' }));

    await waitFor(() => {
      expect(screen.getByText('Mock review page for Document mapping review')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Trigger review exit' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Drive Integration' })).toBeTruthy();
    });

    expect(mockResumeWorkflow).not.toHaveBeenCalled();
    expect(mockResetFlow).toHaveBeenCalledTimes(1);
  });

  it('cancels the workflow and returns to the main view when review cancel is triggered', async () => {
    render(<Page />);

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Mapping Review Ready' }));

    await waitFor(() => {
      expect(screen.getByText('Mock review page for Document mapping review')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Trigger review cancel' }));

    await waitFor(() => {
      expect(mockResumeWorkflow).toHaveBeenCalledWith('run-123', { cancelled: true });
      expect(screen.getByRole('heading', { name: 'Drive Integration' })).toBeTruthy();
    });

    expect(mockResetFlow).toHaveBeenCalledTimes(1);
  });
});
