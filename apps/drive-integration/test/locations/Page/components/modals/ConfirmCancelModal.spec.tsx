import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ConfirmCancelModal } from '../../../../../src/locations/Page/components/modals/ConfirmCancelModal';
import React from 'react';

const onConfirm = vi.fn();
const onCancel = vi.fn();

describe('ConfirmCancelModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Use fake timers so react-modal's removePortal setTimeout is controlled
    // and doesn't fire after jsdom teardown ("document is not defined")
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('renders title and description when open', async () => {
    render(<ConfirmCancelModal isOpen={true} onConfirm={onConfirm} onCancel={onCancel} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Delete this job?' })).toBeTruthy();
      expect(
        screen.getByText(
          "This will permanently delete the job. No entries will be created and you'll need to start over."
        )
      ).toBeTruthy();
    });
  });

  it('renders Keep review open and Delete buttons', async () => {
    render(<ConfirmCancelModal isOpen={true} onConfirm={onConfirm} onCancel={onCancel} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Keep review open' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
    });
  });

  it('calls onConfirm when Delete is clicked', async () => {
    render(<ConfirmCancelModal isOpen={true} onConfirm={onConfirm} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  it('calls onCancel when Keep review open is clicked', async () => {
    render(<ConfirmCancelModal isOpen={true} onConfirm={onConfirm} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Keep review open' }));

    await waitFor(() => {
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  it('does not render content when isOpen is false', async () => {
    render(<ConfirmCancelModal isOpen={false} onConfirm={onConfirm} onCancel={onCancel} />);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Delete this job?' })).toBeNull();
    });
  });

  it('disables both buttons when isConfirming is true', async () => {
    render(
      <ConfirmCancelModal
        isOpen={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
        isConfirming={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Keep review open' })).toHaveProperty(
        'disabled',
        true
      );
      // When isLoading, F36 injects a spinner so the accessible name gains "Loading…".
      // Query by partial text match to stay resilient to the spinner label.
      expect(screen.getByRole('button', { name: /Delete/ })).toHaveProperty('disabled', true);
    });
  });

  it('does not call onConfirm or onCancel when isConfirming is true and buttons are clicked', async () => {
    render(
      <ConfirmCancelModal
        isOpen={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
        isConfirming={true}
      />
    );

    await waitFor(() => screen.getByRole('button', { name: 'Keep review open' }));

    fireEvent.click(screen.getByRole('button', { name: /Delete/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep review open' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
