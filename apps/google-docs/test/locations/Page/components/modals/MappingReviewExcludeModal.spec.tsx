import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { MappingReviewExcludeModal } from '../../../../../src/locations/Page/components/modals/MappingReviewExcludeModal';

const onClose = vi.fn();

describe('MappingReviewExcludeModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and Close when open', async () => {
    render(<MappingReviewExcludeModal isOpen={true} valueLabel="Hero image" onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Exclude from mapping' })).toBeTruthy();
      expect(screen.getByText('Hero image')).toBeTruthy();
      expect(screen.getAllByRole('button', { name: 'Close' }).length).toBeGreaterThan(0);
    });
  });

  it('calls onClose when Close is clicked', async () => {
    render(<MappingReviewExcludeModal isOpen={true} valueLabel="" onClose={onClose} />);

    const closeButtons = screen.getAllByRole('button', { name: 'Close' });
    fireEvent.click(closeButtons[closeButtons.length - 1]);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
