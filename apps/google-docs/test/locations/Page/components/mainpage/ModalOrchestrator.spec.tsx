import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { createRef } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Box, Button } from '@contentful/f36-components';
import {
  ModalOrchestrator,
  ModalOrchestratorHandle,
} from '../../../../../src/locations/Page/components/mainpage/ModalOrchestrator';
import { mockSdk } from '../../../../mocks';

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
};

describe('ModalOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('progresses through flow: ContentTypePicker -> SelectTabs -> IncludeImages -> Loading', async () => {
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
      expect(screen.getByRole('heading', { name: 'Preparing your preview' })).toBeTruthy();
    });
  });
});
