import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Modal } from '@contentful/f36-components';
import { IncludeImagesModal } from './IncludeImagesModal';

const defaultProps = {
  onConfirm: vi.fn(),
  onClose: vi.fn(),
};

const renderModal = (props = {}) =>
  render(
    <Modal isShown={true} onClose={() => {}} size="large">
      {() => <IncludeImagesModal {...defaultProps} {...props} />}
    </Modal>
  );

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

  it('calls onConfirm(true) when include images is selected', async () => {
    renderModal();

    fireEvent.click(screen.getByLabelText('Yes, include images'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
      expect(defaultProps.onConfirm).toHaveBeenCalledWith(true);
    });
  });

  it('calls onConfirm(false) when do not include images is selected', async () => {
    renderModal();

    fireEvent.click(screen.getByLabelText('No, do not include images'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
      expect(defaultProps.onConfirm).toHaveBeenCalledWith(false);
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
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
      expect(screen.getByText('You must choose an option.')).toBeTruthy();
    });
  });
});
