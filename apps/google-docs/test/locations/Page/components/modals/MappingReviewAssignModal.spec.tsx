import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { MappingReviewAssignModal } from '../../../../../src/locations/Page/components/modals/MappingReviewAssignModal';

const onClose = vi.fn();

describe('MappingReviewAssignModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and Close when open', async () => {
    render(<MappingReviewAssignModal isOpen={true} valueLabel="Sample text" onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Assign to field' })).toBeTruthy();
      expect(screen.getByText('Sample text')).toBeTruthy();
      expect(screen.getAllByRole('button', { name: 'Close' }).length).toBeGreaterThan(0);
    });
  });

  it('calls onClose when Close is clicked', async () => {
    render(<MappingReviewAssignModal isOpen={true} valueLabel="" onClose={onClose} />);

    const closeButtons = screen.getAllByRole('button', { name: 'Close' });
    fireEvent.click(closeButtons[closeButtons.length - 1]);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
