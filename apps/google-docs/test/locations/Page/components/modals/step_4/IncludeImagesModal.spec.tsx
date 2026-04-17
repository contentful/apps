import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import { Modal } from '@contentful/f36-components';
import { IncludeImagesModal } from '../../../../../../src/locations/Page/components/modals/step_4/IncludeImagesModal';
import React from 'react';

const defaultProps = {
  onContinue: vi.fn(),
  onClose: vi.fn(),
};

const renderModal = (initialIncludeImages: boolean | null = null, props = {}) => {
  const TestHarness = () => {
    const [includeImages, setIncludeImages] = useState<boolean | null>(initialIncludeImages);

    return (
      <Modal isShown={true} onClose={() => {}} size="large">
        {() => (
          <IncludeImagesModal
            includeImages={includeImages}
            setIncludeImages={setIncludeImages}
            {...defaultProps}
            {...props}
          />
        )}
      </Modal>
    );
  };

  return render(<TestHarness />);
};

describe('IncludeImagesModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders copy and the include/exclude choices', async () => {
    renderModal();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Images' })).toBeTruthy();
      expect(
        screen.getByText(
          'The selected document contains images. Should the images be imported from your document?'
        )
      ).toBeTruthy();
      expect(screen.getByLabelText('Yes, include images')).toBeTruthy();
      expect(screen.getByLabelText('No, do not include images')).toBeTruthy();
    });
  });

  it('calls onContinue(true) when include images is selected', async () => {
    renderModal();

    fireEvent.click(screen.getByLabelText('Yes, include images'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(defaultProps.onContinue).toHaveBeenCalledTimes(1);
      expect(defaultProps.onContinue).toHaveBeenCalledWith(true);
    });
  });

  it('calls onContinue(false) when do not include images is selected', async () => {
    renderModal();

    fireEvent.click(screen.getByLabelText('No, do not include images'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(defaultProps.onContinue).toHaveBeenCalledTimes(1);
      expect(defaultProps.onContinue).toHaveBeenCalledWith(false);
    });
  });

  it('calls onClose when Cancel is clicked', async () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('shows validation and does not confirm when no option is selected', async () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(defaultProps.onContinue).not.toHaveBeenCalled();
      expect(screen.getByText('You must select an option.')).toBeTruthy();
    });
  });
});
