import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorModal } from '../../../../../src/locations/Page/components/modals/ErrorModal';

describe('ErrorModal', () => {
  it('renders the provided title and message with the default close action', () => {
    const onClose = vi.fn();

    render(
      <ErrorModal
        isOpen={true}
        onClose={onClose}
        config={{
          title: 'Unable to generate preview',
          message: 'This preview could not be completed. Please start again.',
        }}
      />
    );

    expect(screen.getByText('Unable to generate preview')).toBeTruthy();
    expect(
      screen.getByText('This preview could not be completed. Please start again.')
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses custom primary and secondary actions from the config', () => {
    const onClose = vi.fn();
    const onPrimaryAction = vi.fn();
    const onSecondaryAction = vi.fn();

    render(
      <ErrorModal
        isOpen={true}
        onClose={onClose}
        config={{
          title: 'Reconnect Google Drive to continue',
          message: 'Your Google Drive connection has expired.',
          primaryActionLabel: 'Reconnect Google Drive',
          onPrimaryAction,
          secondaryActionLabel: 'Cancel',
          onSecondaryAction,
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reconnect Google Drive' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
    expect(onSecondaryAction).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('falls back to onClose when only a secondary action label is provided', () => {
    const onClose = vi.fn();

    render(
      <ErrorModal
        isOpen={true}
        onClose={onClose}
        config={{
          title: 'Test title',
          message: 'Test message',
          secondaryActionLabel: 'Back',
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
