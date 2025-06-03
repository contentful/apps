import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import Page from '../../../src/locations/Page';
import { mockSdk } from '../../mocks/mockSdk';
import { createMockCma } from '../../mocks/mockCma';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('Page Error Handling', () => {
  beforeEach(() => {
    mockSdk.cma = createMockCma({ shouldError: true });
  });

  it('handles content type fetch error gracefully', async () => {
    await act(async () => {
      render(<Page />);
    });
    await waitFor(() => {
      expect(screen.queryByText('Condo A')).not.toBeInTheDocument();
    });
  });

  it('handles entry fetch error gracefully', async () => {
    mockSdk.cma = createMockCma({
      shouldError: false,
      errorMessage: 'Failed to fetch entries',
    });
    mockSdk.cma.entry.getMany = vi.fn().mockRejectedValue(new Error('Failed to fetch entries'));

    await act(async () => {
      render(<Page />);
    });
    await waitFor(() => {
      expect(screen.queryByText('Building one')).not.toBeInTheDocument();
    });
  });
});
