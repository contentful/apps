import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ConfirmCancelModal } from '../../../../../src/locations/Page/components/modals/ConfirmCancelModal';
import React from 'react';

const onConfirm = vi.fn();
const onCancel = vi.fn();

describe('ConfirmCancelModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and description when open', async () => {
    render(<ConfirmCancelModal isOpen={true} onConfirm={onConfirm} onCancel={onCancel} />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: "You're about to lose your progress" })
      ).toBeTruthy();
      expect(
        screen.getByText("No entries will be created and you'll need to start over.")
      ).toBeTruthy();
    });
  });

  it('renders Keep creating and Cancel without creating buttons', async () => {
    render(<ConfirmCancelModal isOpen={true} onConfirm={onConfirm} onCancel={onCancel} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Keep creating' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Cancel without creating' })).toBeTruthy();
    });
  });

  it('calls onConfirm when Cancel without creating is clicked', async () => {
    render(<ConfirmCancelModal isOpen={true} onConfirm={onConfirm} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel without creating' }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  it('calls onCancel when Keep creating is clicked', async () => {
    render(<ConfirmCancelModal isOpen={true} onConfirm={onConfirm} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Keep creating' }));

    await waitFor(() => {
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  it('does not render content when isOpen is false', async () => {
    render(<ConfirmCancelModal isOpen={false} onConfirm={onConfirm} onCancel={onCancel} />);

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: "You're about to lose your progress" })
      ).toBeNull();
    });
  });
});
