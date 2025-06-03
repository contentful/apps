import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import Page from '../../../src/locations/Page';
import { mockSdk } from '../../mocks/mockSdk';
import { createMockCma } from '../../mocks/mockCma';
import { mockEntry } from '../../mocks/mockEntries';
import { mockContentTypes } from '../../mocks/mockContentTypes';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('Page Table Features', () => {
  beforeEach(() => {
    mockSdk.cma = createMockCma();
  });

  it('renders all fields in the table header', async () => {
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText('Display Name')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
  });

  it('renders entry data in the table cells', async () => {
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText('Building one')).toBeInTheDocument();
    });
  });

  it('handles missing field values gracefully', async () => {
    const entryWithMissingField = {
      ...mockEntry,
      fields: {
        displayName: { 'en-US': 'Building one' },
        // description field is missing
      },
    };

    mockSdk.cma.entry.getMany = vi.fn().mockResolvedValue({ items: [entryWithMissingField] });

    render(<Page />);
    await waitFor(() => {
      const descriptionCell = screen
        .getByText('Building one')
        .closest('tr')
        ?.querySelector('td:last-child');
      expect(descriptionCell?.textContent).toBe('');
    });
  });

  it('freezes the display name column when scrolling horizontally', async () => {
    render(<Page />);
    const displayNameCells = await screen.findAllByTestId('display-name-cell');
    displayNameCells.forEach((cell) => {
      expect(
        cell.style.position === 'sticky' ||
          cell.className.includes('sticky') ||
          cell.className.includes('frozen')
      ).toBeTruthy();
    });
  });

  it('renders a Status column and correct status for each entry', async () => {
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });
  });

  it('updates the table when a different content type is selected', async () => {
    render(<Page />);

    await waitFor(() => {
      screen.findByText('Bulk edit Condo A');
    });
    await fireEvent.click(screen.getByText('Condo B'));

    await waitFor(() => {
      expect(screen.getByText('B1')).toBeInTheDocument();
    });

    expect(screen.getByText('B2')).toBeInTheDocument();
  });
});
