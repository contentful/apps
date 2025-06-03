import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import Page from '../../../src/locations/Page';
import { mockSdk } from '../../mocks/mockSdk';
import { createMockCma } from '../../mocks/mockCma';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('Page Loading States', () => {
  beforeEach(() => {
    mockSdk.cma = createMockCma({ delay: 100 });
  });

  it('shows loading spinner during initial content type fetch', async () => {
    await act(async () => {
      render(<Page />);
    });
    expect(screen.getAllByTitle('Loading…')[0]).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTitle('Loading…')).not.toBeInTheDocument();
    });
  });

  it('shows loading spinner during entries fetch', async () => {
    await act(async () => {
      render(<Page />);
    });

    // Wait for initial content type load
    await waitFor(() => {
      expect(screen.getByText('Condo A')).toBeInTheDocument();
    });

    // Verify loading spinner appears during entries fetch
    expect(screen.getAllByTitle('Loading…')[0]).toBeInTheDocument();

    // Wait for entries to load
    await waitFor(() => {
      expect(screen.queryByTitle('Loading…')).not.toBeInTheDocument();
    });
  });
});
