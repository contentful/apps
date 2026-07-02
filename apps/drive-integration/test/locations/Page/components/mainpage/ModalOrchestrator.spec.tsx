import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Box, Button } from '@contentful/f36-components';
import {
  ModalOrchestrator,
  ModalOrchestratorHandle,
} from '../../../../../src/locations/Page/components/mainpage/ModalOrchestrator';
import {
  MappingReviewSuspendPayload,
  CompletedWorkflowPayload,
  WorkflowRunResult,
  RunStatus,
} from '@types';
import { mockSdk } from '../../../../mocks';
import { DocumentScopeConfig } from '../../../../../src/utils/fetchDocumentScope';

const mockStartWorkflow = vi.fn();
const mockResumeWorkflow = vi.fn();
const mockFetchDocumentScope = vi.fn();

const mockWorkflowPayload = {
  entries: [],
  assets: [],
  referenceGraph: {},
} satisfies CompletedWorkflowPayload;

const mockDocumentScope: DocumentScopeConfig = {
  tabs: [
    { id: 'tab-1', title: 'Introduction', index: 0 },
    { id: 'tab-2', title: 'Appendix', index: 1 },
  ],
  imageCount: 2,
};

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

vi.mock('../../../../../src/utils/fetchDocumentScope', () => ({
  fetchDocumentScope: (...args: unknown[]) => mockFetchDocumentScope(...args),
}));

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

const mockContentTypes = [
  { sys: { id: 'ct-1' }, name: 'Blog Post' },
  { sys: { id: 'ct-2' }, name: 'Article' },
];

const defaultProps = {
  sdk: mockSdk,
  oauthToken: 'mock-oauth-token',
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

// Helper: pick a document and reach the content type picker
async function pickDocument(ref: React.RefObject<ModalOrchestratorHandle>) {
  await act(async () => {
    ref.current?.startFlow();
  });
  fireEvent.click(screen.getByRole('button', { name: 'Pick document' }));
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'Select content type(s)' })).toBeTruthy();
  });
}

// Helper: select ct-1 in the multiselect and click Next
async function selectContentTypeAndNext() {
  const multiselectToggle = screen.getByRole('button', { name: /toggle multiselect/i });
  fireEvent.click(multiselectToggle);
  await waitFor(() => {
    expect(document.querySelector('[data-test-id="cf-multiselect-list-item-ct-1"]')).toBeTruthy();
  });
  const optionInput = document
    .querySelector('[data-test-id="cf-multiselect-list-item-ct-1"]')
    ?.closest('label')
    ?.querySelector('input') as HTMLInputElement;
  if (optionInput) fireEvent.click(optionInput);
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
}

// Helper: go through pre-flight tab + image selection
async function completePreflight(options: { useAllTabs: boolean; includeImages: boolean }) {
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'Document tabs' })).toBeTruthy();
  });

  if (options.useAllTabs) {
    fireEvent.click(screen.getByLabelText('No, import all tabs'));
  } else {
    fireEvent.click(screen.getByLabelText('Yes, let me pick'));
  }
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));

  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'Images' })).toBeTruthy();
  });

  if (options.includeImages) {
    fireEvent.click(screen.getByLabelText('Yes, include images'));
  } else {
    fireEvent.click(screen.getByLabelText('No, skip images'));
  }
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
}

describe('ModalOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps.onMappingReviewReady.mockReset();
    defaultProps.onResetToMain.mockReset();
    mockFetchDocumentScope.mockResolvedValue(mockDocumentScope);
    vi.mocked(mockSdk.cma.contentType.getMany).mockResolvedValue({
      items: mockContentTypes,
      total: mockContentTypes.length,
    });
    mockStartWorkflow.mockResolvedValue({
      status: RunStatus.COMPLETED,
      runId: 'run-123',
      messages: [],
      googleDocPayload: mockWorkflowPayload,
    } satisfies WorkflowRunResult);
    mockResumeWorkflow.mockResolvedValue({
      status: RunStatus.COMPLETED,
      runId: 'run-123',
      messages: [],
      googleDocPayload: mockWorkflowPayload,
    } satisfies WorkflowRunResult);
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
      expect(mockResumeWorkflow).not.toHaveBeenCalled();
    });
  });

  it('clears stored progress when resetFlow is called', async () => {
    const ref = createRef<ModalOrchestratorHandle>();
    render(<ModalOrchestrator ref={ref} {...defaultProps} />);

    await act(async () => {
      ref.current?.startFlow();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pick document' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Select content type(s)' })).toBeTruthy();
    });

    await act(async () => {
      ref.current?.resetFlow();
    });

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Select content type(s)' })).toBeNull();
    });

    await act(async () => {
      ref.current?.startFlow();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pick document' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Pick document' })).toBeNull();
      expect(
        screen.queryByRole('heading', { name: "You're about to lose your progress" })
      ).toBeNull();
    });
  });

  it('discards at pre-flight tab step without calling resumeWorkflow', async () => {
    const ref = createRef<ModalOrchestratorHandle>();
    render(<ModalOrchestrator ref={ref} {...defaultProps} />);

    await pickDocument(ref);
    await selectContentTypeAndNext();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Document tabs' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: "You're about to lose your progress" })
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel without creating' }));

    await waitFor(() => {
      // No active workflow run exists yet — nothing to resume as cancelled
      expect(mockResumeWorkflow).not.toHaveBeenCalled();
      expect(screen.queryByRole('heading', { name: 'Document tabs' })).toBeNull();
    });
  });

  it('fetches document scope pre-flight and routes through tab and image selection before starting workflow', async () => {
    const ref = createRef<ModalOrchestratorHandle>();
    render(<ModalOrchestrator ref={ref} {...defaultProps} />);

    await pickDocument(ref);
    await selectContentTypeAndNext();

    await waitFor(() => {
      expect(mockFetchDocumentScope).toHaveBeenCalledWith('mock-doc-id-123', 'mock-oauth-token');
    });

    // Tabs shown because fetchDocumentScope returned 2 tabs
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Document tabs' })).toBeTruthy();
    });

    // "No, import all tabs" = useAllTabs=true → onContinue called with all available tabs
    fireEvent.click(screen.getByLabelText('No, import all tabs'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    // Images shown because imageCount > 0
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Images' })).toBeTruthy();
    });

    fireEvent.click(screen.getByLabelText('Yes, include images'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(mockStartWorkflow).toHaveBeenCalledWith(['ct-1'], {
        selectedTabIds: ['tab-1', 'tab-2'],
        includeImages: true,
      });
    });
  });

  it('skips image step and starts workflow directly when document has no images', async () => {
    mockFetchDocumentScope.mockResolvedValue({
      tabs: [
        { id: 'tab-1', title: 'Intro', index: 0 },
        { id: 'tab-2', title: 'Appendix', index: 1 },
      ],
      imageCount: 0,
    } satisfies DocumentScopeConfig);

    const ref = createRef<ModalOrchestratorHandle>();
    render(<ModalOrchestrator ref={ref} {...defaultProps} />);

    await pickDocument(ref);
    await selectContentTypeAndNext();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Document tabs' })).toBeTruthy();
    });

    fireEvent.click(screen.getByLabelText('No, import all tabs'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(mockStartWorkflow).toHaveBeenCalledWith(['ct-1'], {
        selectedTabIds: ['tab-1', 'tab-2'],
      });
    });
  });

  it('skips tab and image steps and starts workflow directly for a single-tab doc with no images', async () => {
    mockFetchDocumentScope.mockResolvedValue({
      tabs: [{ id: 'tab-1', title: 'Main', index: 0 }],
      imageCount: 0,
    } satisfies DocumentScopeConfig);

    const ref = createRef<ModalOrchestratorHandle>();
    render(<ModalOrchestrator ref={ref} {...defaultProps} />);

    await pickDocument(ref);
    await selectContentTypeAndNext();

    await waitFor(() => {
      expect(mockStartWorkflow).toHaveBeenCalledWith(['ct-1'], undefined);
    });

    // No tab or image modal shown
    expect(screen.queryByRole('heading', { name: 'Document tabs' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Images' })).toBeNull();
  });

  it('routes mapping-review suspend to onMappingReviewReady after pre-flight selection', async () => {
    mockStartWorkflow.mockResolvedValue({
      status: RunStatus.PENDING_REVIEW,
      runId: 'run-123',
      messages: [],
      suspendPayload: mappingReviewSuspendPayload,
    } satisfies WorkflowRunResult);

    const ref = createRef<ModalOrchestratorHandle>();
    render(<ModalOrchestrator ref={ref} {...defaultProps} />);

    await pickDocument(ref);
    await selectContentTypeAndNext();
    await completePreflight({ useAllTabs: true, includeImages: true });

    await waitFor(() => {
      expect(defaultProps.onMappingReviewReady).toHaveBeenCalledWith(
        mappingReviewSuspendPayload,
        'run-123'
      );
    });
  });
});
