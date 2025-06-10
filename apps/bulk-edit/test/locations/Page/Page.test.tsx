import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import Page from '../../../src/locations/Page';
import { mockSdk } from '../../mocks/mockSdk';
import { createMockCma, getManyContentTypes, getManyEntries } from '../../mocks/mockCma';
import { condoAContentType } from '../../mocks/mockContentTypes';
import { condoAEntry1, condoAEntry2, condoAEntries } from '../../mocks/mockEntries';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('Page', () => {
  beforeEach(() => {
    mockSdk.cma = createMockCma();
    mockSdk.cma.contentType.getMany = vi
      .fn()
      .mockResolvedValue(getManyContentTypes([condoAContentType]));
  });

  it('shows loading spinner during initial content type fetch', async () => {
    render(<Page />);
    expect(screen.getAllByTitle('Loading…')[0]).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTitle('Loading…')).not.toBeInTheDocument();
    });
  });

  it('renders the main page structure', async () => {
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByTestId('content-types-nav')).toBeInTheDocument();
      expect(screen.getByTestId('bulk-edit-table')).toBeInTheDocument();
    });
  });

  it('does not show Edit/Bulk edit button when no field is selected', async () => {
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByTestId('bulk-edit-table')).toBeInTheDocument();
    });
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Bulk edit')).not.toBeInTheDocument();
  });

  // TODO: Fix This test is not working as expected. The checkbox is not visible when hovered.
  it.skip('shows Edit button when one field is selected and correct count', async () => {
    render(<Page />);
    // Wait for table to load
    await waitFor(() => {
      expect(screen.getByTestId('bulk-edit-table')).toBeInTheDocument();
    });
    // Simulate hover to make the checkbox visible (like EntryTable.test.tsx)
    const cellCheckbox = screen.getByTestId('cell-checkbox-size-entry-1');
    fireEvent.mouseEnter(cellCheckbox.parentElement!);
    fireEvent.click(cellCheckbox);
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText(/1 entry field selected/)).toBeInTheDocument();
    });
  });
});
