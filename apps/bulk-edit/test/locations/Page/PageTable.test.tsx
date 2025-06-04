import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import Page from '../../../src/locations/Page';
import { mockSdk } from '../../mocks/mockSdk';
import { createMockCma } from '../../mocks/mockCma';
import { mockEntries, createMockEntry } from '../../mocks/mockEntries';
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
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Is Active')).toBeInTheDocument();
    });
  });

  it('renders entry data in the table cells', async () => {
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByText('true')).toBeInTheDocument();
    });
  });

  it('handles missing field values gracefully', async () => {
    const entryWithMissingField = createMockEntry({ displayName: { 'en-US': 'Building one' } });
    mockSdk.cma.entry.getMany = vi.fn().mockResolvedValue({ items: [entryWithMissingField] });
    render(<Page />);
    await waitFor(() => {
      const descriptionCell = screen
        .getByText('Building one')
        .closest('tr')
        ?.querySelector('td:last-child');
      expect(descriptionCell?.textContent).toBe('-');
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

  it('renders a Location field as Lat/Lon in the table', async () => {
    mockSdk.cma = createMockCma();
    mockSdk.cma.entry.getMany = vi
      .fn()
      .mockResolvedValue({ items: mockEntries.buildingWithLocation });
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText('Building With Location')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Building With Location'));
    await waitFor(() => {
      expect(screen.getByText('Lat: 39.73923, Lon: -104.99025')).toBeInTheDocument();
    });
  });

  it('renders a Boolean field as true/false in the table', async () => {
    mockSdk.cma = createMockCma();
    mockSdk.cma.entry.getMany = vi
      .fn()
      .mockResolvedValue({ items: mockEntries.buildingWithBoolean });
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText('Building With Boolean')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Building With Boolean'));
    await waitFor(() => {
      expect(screen.getByText('true')).toBeInTheDocument();
    });
  });

  it('shows Untitled if the display name is missing', async () => {
    const entryWithNoTitle = createMockEntry({ description: { 'en-US': 'Test Description' } });
    mockSdk.cma = createMockCma();
    mockSdk.cma.entry.getMany = vi.fn().mockResolvedValue({ items: [entryWithNoTitle] });
    render(<Page />);
    await waitFor(() => {
      // Should show Untitled in the first column
      expect(screen.getByText('Untitled')).toBeInTheDocument();
    });
  });
});
