import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RemoveContentModal } from '../../../../../../src/locations/Page/components/review/mapping/edit-modals/RemoveContentModal';
import React from 'react';

describe('RemoveContentModal', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('does not render when closed', () => {
    render(<RemoveContentModal isOpen={false} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.queryByText('Remove content from entry')).toBeNull();
  });

  it('renders the confirmation copy and controls when open', () => {
    render(<RemoveContentModal isOpen={true} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Remove content from entry' })).toBeTruthy();
    expect(
      screen.getByText("Are you sure you'd like to remove this content from the entry?")
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeTruthy();
  });

  it('calls onConfirm when Remove is clicked', () => {
    const onConfirm = vi.fn();

    render(<RemoveContentModal isOpen={true} onConfirm={onConfirm} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();

    render(<RemoveContentModal isOpen={true} onConfirm={vi.fn()} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
