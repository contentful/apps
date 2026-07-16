import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Box, Button } from '@contentful/f36-components';
import {
  ModalOrchestrator,
  ModalOrchestratorHandle,
} from '../../../../../src/locations/Page/components/mainpage/ModalOrchestrator';
import { mockSdk } from '../../../../mocks';
import { DocumentSelectionConfig } from '../../../../../src/utils/fetchDocumentSelection';

const mockStartWorkflow = vi.fn();
const mockAddRun = vi.fn();
const mockFetchDocumentSelection = vi.fn();

const mockDocumentSelectionConfig: DocumentSelectionConfig = {
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
    startWorkflow: mockStartWorkflow,
  }),
}));

vi.mock('../../../../../src/utils/fetchDocumentSelection', () => ({
  fetchDocumentSelection: (...args: unknown[]) => mockFetchDocumentSelection(...args),
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
  isOAuthConnected: true,
  onRunStarted: vi.fn(),
  onResetToMain: vi.fn(),
  addRun: mockAddRun,
  storageError: null,
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
    fireEvent.click(screen.getByLabelText('Yes, select specific tabs'));
  }
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));

  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'Images' })).toBeTruthy();
  });

  if (options.includeImages) {
    fireEvent.click(screen.getByLabelText('Yes, include images'));
  } else {
    fireEvent.click(screen.getByLabelText('No, do not include images'));
  }
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
}

describe('ModalOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps.onRunStarted.mockReset();
    defaultProps.onResetToMain.mockReset();
    mockFetchDocumentSelection.mockResolvedValue(mockDocumentSelectionConfig);
    vi.mocked(mockSdk.cma.contentType.getMany).mockResolvedValue({
      items: mockContentTypes,
      total: mockContentTypes.length,
    });
    // startWorkflow now returns just a runId string
    mockStartWorkflow.mockResolvedValue('run-123');
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

  it('discards at pre-flight tab step without calling addRun', async () => {
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
      expect(mockAddRun).not.toHaveBeenCalled();
      expect(screen.queryByRole('heading', { name: 'Document tabs' })).toBeNull();
    });
  });

  it('fetches document scope pre-flight and routes through tab and image selection before starting workflow', async () => {
    const ref = createRef<ModalOrchestratorHandle>();
    render(<ModalOrchestrator ref={ref} {...defaultProps} />);

    await pickDocument(ref);
    await selectContentTypeAndNext();

    await waitFor(() => {
      expect(mockFetchDocumentSelection).toHaveBeenCalledWith(
        'mock-doc-id-123',
        'mock-oauth-token'
      );
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
      expect(mockStartWorkflow).toHaveBeenCalledWith(['ct-1'], {
        selectedTabIds: ['tab-1', 'tab-2'],
        includeImages: true,
      });
    });
  });

  it('calls addRun with correct RunRecord fields after startWorkflow resolves', async () => {
    const ref = createRef<ModalOrchestratorHandle>();
    render(<ModalOrchestrator ref={ref} {...defaultProps} />);

    await pickDocument(ref);
    await selectContentTypeAndNext();
    await completePreflight({ useAllTabs: true, includeImages: false });

    await waitFor(() => {
      expect(mockAddRun).toHaveBeenCalledWith(
        expect.objectContaining({
          runId: 'run-123',
          documentId: 'mock-doc-id-123',
          contentTypeIds: ['ct-1'],
        })
      );
    });
  });

  it('calls onRunStarted with runId after startWorkflow resolves', async () => {
    const ref = createRef<ModalOrchestratorHandle>();
    render(<ModalOrchestrator ref={ref} {...defaultProps} />);

    await pickDocument(ref);
    await selectContentTypeAndNext();
    await completePreflight({ useAllTabs: true, includeImages: false });

    await waitFor(() => {
      expect(defaultProps.onRunStarted).toHaveBeenCalledWith('run-123');
    });
  });

  it('does NOT call onMappingReviewReady (prop removed)', async () => {
    // onMappingReviewReady is no longer a prop — verify the component still works after workflow
    const ref = createRef<ModalOrchestratorHandle>();
    const propsWithoutReviewReady = { ...defaultProps };
    render(<ModalOrchestrator ref={ref} {...propsWithoutReviewReady} />);

    await pickDocument(ref);
    await selectContentTypeAndNext();
    await completePreflight({ useAllTabs: true, includeImages: false });

    await waitFor(() => {
      expect(defaultProps.onRunStarted).toHaveBeenCalledWith('run-123');
    });
    // No crash, no review-ready call
  });

  it('skips image step and starts workflow directly when document has no images', async () => {
    mockFetchDocumentSelection.mockResolvedValue({
      tabs: [
        { id: 'tab-1', title: 'Intro', index: 0 },
        { id: 'tab-2', title: 'Appendix', index: 1 },
      ],
      imageCount: 0,
    } satisfies DocumentSelectionConfig);

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
        includeImages: false,
      });
    });
  });

  it('skips tab and image steps and starts workflow directly for a single-tab doc with no images', async () => {
    mockFetchDocumentSelection.mockResolvedValue({
      tabs: [{ id: 'tab-1', title: 'Main', index: 0 }],
      imageCount: 0,
    } satisfies DocumentSelectionConfig);

    const ref = createRef<ModalOrchestratorHandle>();
    render(<ModalOrchestrator ref={ref} {...defaultProps} />);

    await pickDocument(ref);
    await selectContentTypeAndNext();

    await waitFor(() => {
      expect(mockStartWorkflow).toHaveBeenCalledWith(['ct-1'], {
        selectedTabIds: [],
        includeImages: false,
      });
    });

    expect(screen.queryByRole('heading', { name: 'Document tabs' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Images' })).toBeNull();
  });
});
