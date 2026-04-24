import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorNote } from '../../../src/locations/Page/components/ErrorNote';
import { condoAEntry1, condoAEntry2 } from '../../mocks/mockEntries';
import { describe, it, expect, vi } from 'vitest';
import { condoAContentType } from '../../mocks/mockContentTypes';

describe('ErrorNote', () => {
  const defaultProps = {
    failedUpdates: [condoAEntry1],
    selectedContentType: condoAContentType,
    defaultLocale: 'en-US',
    onClose: vi.fn(),
  };

  it('renders error message for single failed update', () => {
    render(<ErrorNote {...defaultProps} />);

    expect(screen.getByText(/1 field did not update/)).toBeInTheDocument();
  });

  it('renders error message for multiple failed updates', () => {
    render(<ErrorNote {...defaultProps} failedUpdates={[condoAEntry1, condoAEntry2]} />);

    expect(screen.getByText(/2 fields did not update/)).toBeInTheDocument();
    expect(screen.getByText(/and 1 more entry field/)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ErrorNote {...defaultProps} />);

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('does not render when there are no failed updates', () => {
    render(<ErrorNote {...defaultProps} failedUpdates={[]} />);

    expect(screen.queryByText(/field.*did not update/)).not.toBeInTheDocument();
  });
});
