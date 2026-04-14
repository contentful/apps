import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Box, Button } from '@contentful/f36-components';
import {
  ModalOrchestrator,
  ModalOrchestratorHandle,
} from '../../../../../src/locations/Page/components/mainpage/ModalOrchestrator';
import { MappingReviewSuspendPayload, PreviewPayload, WorkflowRunResult, RunStatus } from '@types';
import { mockSdk } from '../../../../mocks';

const mockStartWorkflow = vi.fn();
const mockResumeWorkflow = vi.fn();

const mockWorkflowPayload = {
  entries: [],
  assets: [],
  referenceGraph: {},
  normalizedDocument: {
    documentId: 'mock-doc-id',
    title: 'Mock Preview Title',
    designValues: [],
    contentBlocks: [],
    images: [],
    tables: [],
    assets: [],
  },
} satisfies PreviewPayload;

vi.mock('../../../../../src/locations/Page/components/modals/step_1/SelectDocumentModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: (documentId?: string) => void }) => {
    if (!isOpen) return null;
    return (
      <Box data-test-id="select-document-modal">
        <Button onClick={() => onClose('mock-doc-id-123')} data-test-id="pick-document">
          Pick document
        </Button>
        <Button variant="secondary" onClick={() => onClose()} data-test-id="cancel-pick">
          Cancel
        </Button>
      </Box>
    );
  },
}));

vi.mock('@hooks/useWorkflowAgent', () => ({
  useWorkflowAgent: () => ({
    isAnalyzing: false,
    error: null,
    startWorkflow: mockStartWorkflow,
    resumeWorkflow: mockResumeWorkflow,
  }),
}));

const mockContentTypes = [
  { sys: { id: 'ct-1' }, name: 'Blog Post' },
  { sys: { id: 'ct-2' }, name: 'Article' },
];

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

const defaultProps = {
  sdk: mockSdk,
  oauthToken: 'mock-oauth-token',
  onPreviewReady: vi.fn(),
  onMappingReviewReady: vi.fn(),
  onResetToMain: vi.fn(),
};

const mappingReviewSuspendPayload: MappingReviewSuspendPayload = {
  suspendStepId: 'mapping-review',
  reason: 'Mapping review required before CMA payload generation continues',
  documentId: 'mock-doc-id-123',
  documentTitle: 'Mock Mapping Review',
  normalizedDocument: {
    documentId: 'mock-doc-id-123',
    title: 'Mock Mapping Review',
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

describe('ModalOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps.onPreviewReady.mockReset();
    defaultProps.onMappingReviewReady.mockReset();
    defaultProps.onResetToMain.mockReset();
    mockStartWorkflow.mockResolvedValue({
      status: RunStatus.PENDING_REVIEW,
      runId: 'run-123',
      messages: [],
      suspendPayload: {
        suspendStepId: 'select-tabs-images-step',
        reason: 'Needs document scope review',
        documentId: 'mock-doc-id-123',
        requiresImageSelection: true,
        requiresTabSelection: true,
        imageCount: 2,
        inlineObjectCount: 2,
        positionedObjectCount: 0,
        tabCount: 2,
        tabs: [
          { id: 'tab-1', title: 'Introduction', index: 0 },
          { id: 'tab-2', title: 'Appendix', index: 1 },
        ],
      },
    } satisfies WorkflowRunResult);
    mockResumeWorkflow.mockResolvedValue({
      status: RunStatus.COMPLETED,
      runId: 'run-123',
      messages: [],
      googleDocPayload: mockWorkflowPayload,
    } satisfies WorkflowRunResult);
    vi.mocked(mockSdk.cma.space.get).mockResolvedValue({ sys: { id: 'test-space-id' } });
    vi.mocked(mockSdk.cma.environment.get).mockResolvedValue({ sys: { id: 'test-env-id' } });
    vi.mocked(mockSdk.cma.contentType.getMany).mockResolvedValue({
      items: mockContentTypes,
      total: mockContentTypes.length,
    });
  });

  it('shows ContentTypePickerModal after document is picked', async () => {
    const ref = createRef<ModalOrchestratorHandle>();
    render(<ModalOrchestrator ref={ref} {...defaultProps} />);

    await act(async () => {
      ref.current?.startFlow();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pick document' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Pick document' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Select content type(s)' })).toBeTruthy();
    });
  });

  it('closes upload modal when canceling document pick with no progress', async () => {
    const ref = createRef<ModalOrchestratorHandle>();
    render(<ModalOrchestrator ref={ref} {...defaultProps} />);

    await act(async () => {
      ref.current?.startFlow();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pick document' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Pick document' })).toBeNull();
    });
  });

  it('shows ConfirmCancelModal when closing with progress', async () => {
    const ref = createRef<ModalOrchestratorHandle>();
    render(<ModalOrchestrator ref={ref} {...defaultProps} />);

    await act(async () => {
      ref.current?.startFlow();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pick document' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Select content type(s)' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: "You're about to lose your progress" })
      ).toBeTruthy();
    });
  });

  it('resets flow when confirming discard in ConfirmCancelModal', async () => {
    const ref = createRef<ModalOrchestratorHandle>();
    render(<ModalOrchestrator ref={ref} {...defaultProps} />);

    await act(async () => {
      ref.current?.startFlow();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pick document' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Select content type(s)' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: "You're about to lose your progress" })
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel without creating' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Select content type(s)' })).toBeNull();
      expect(
        screen.queryByRole('heading', { name: "You're about to lose your progress" })
      ).toBeNull();
    });
  });

  it('starts the workflow after selecting content types and shows the document scope review steps', async () => {
    let resolveStartWorkflow: ((value: WorkflowRunResult) => void) | undefined;
    mockStartWorkflow.mockImplementation(
      () =>
        new Promise<WorkflowRunResult>((resolve) => {
          resolveStartWorkflow = resolve;
        })
    );

    const ref = createRef<ModalOrchestratorHandle>();
    render(<ModalOrchestrator ref={ref} {...defaultProps} />);

    await act(async () => {
      ref.current?.startFlow();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pick document' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Select content type(s)' })).toBeTruthy();
    });

    const multiselectToggle = screen.getByRole('button', { name: /toggle multiselect/i });
    fireEvent.click(multiselectToggle);

    await waitFor(() => {
      const option = document.querySelector('[data-test-id="cf-multiselect-list-item-ct-1"]');
      expect(option).toBeTruthy();
    });

    const optionInput = document
      .querySelector('[data-test-id="cf-multiselect-list-item-ct-1"]')
      ?.closest('label')
      ?.querySelector('input') as HTMLInputElement;
    if (optionInput) fireEvent.click(optionInput);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(mockStartWorkflow).toHaveBeenCalledWith(['ct-1']);
    });

    resolveStartWorkflow?.({
      status: RunStatus.PENDING_REVIEW,
      runId: 'run-123',
      messages: [],
      suspendPayload: {
        suspendStepId: 'select-tabs-images-step',
        reason: 'Needs document scope review',
        documentId: 'mock-doc-id-123',
        requiresImageSelection: true,
        requiresTabSelection: true,
        imageCount: 2,
        inlineObjectCount: 2,
        positionedObjectCount: 0,
        tabCount: 2,
        tabs: [
          { id: 'tab-1', title: 'Introduction', index: 0 },
          { id: 'tab-2', title: 'Appendix', index: 1 },
        ],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Document tabs' })).toBeTruthy();
    });

    fireEvent.click(screen.getByLabelText('No, import all tabs'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Images' })).toBeTruthy();
    });

    fireEvent.click(screen.getByLabelText('Yes, include images'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(mockResumeWorkflow).toHaveBeenCalledWith('run-123', {
        includeImages: true,
        selectedTabIds: ['tab-1', 'tab-2'],
      });
      expect(screen.queryByRole('heading', { name: 'Preparing your preview' })).toBeNull();
      expect(defaultProps.onPreviewReady).toHaveBeenCalledWith(mockWorkflowPayload);
    });
  });

  it('routes mapping-review suspends to onMappingReviewReady after document scope review', async () => {
    mockResumeWorkflow.mockResolvedValueOnce({
      status: RunStatus.PENDING_REVIEW,
      runId: 'run-123',
      messages: [],
      suspendPayload: mappingReviewSuspendPayload,
    } satisfies WorkflowRunResult);

    const ref = createRef<ModalOrchestratorHandle>();
    render(<ModalOrchestrator ref={ref} {...defaultProps} />);

    await act(async () => {
      ref.current?.startFlow();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pick document' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Select content type(s)' })).toBeTruthy();
    });

    const multiselectToggle = screen.getByRole('button', { name: /toggle multiselect/i });
    fireEvent.click(multiselectToggle);

    await waitFor(() => {
      const option = document.querySelector('[data-test-id="cf-multiselect-list-item-ct-1"]');
      expect(option).toBeTruthy();
    });

    const optionInput = document
      .querySelector('[data-test-id="cf-multiselect-list-item-ct-1"]')
      ?.closest('label')
      ?.querySelector('input') as HTMLInputElement;
    if (optionInput) fireEvent.click(optionInput);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(mockStartWorkflow).toHaveBeenCalledWith(['ct-1']);
    });

    await act(async () => {
      // use the default pending review response configured in beforeEach
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Document tabs' })).toBeTruthy();
    });

    fireEvent.click(screen.getByLabelText('No, import all tabs'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Images' })).toBeTruthy();
    });

    fireEvent.click(screen.getByLabelText('Yes, include images'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(defaultProps.onMappingReviewReady).toHaveBeenCalledWith(mappingReviewSuspendPayload);
      expect(defaultProps.onPreviewReady).not.toHaveBeenCalled();
    });
  });
});
