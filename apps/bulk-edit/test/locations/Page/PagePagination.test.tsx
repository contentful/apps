import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import Page from '../../../src/locations/Page';
import { mockSdk } from '../../mocks/mockSdk';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

const mockEntries = (count: number, offset = 0) =>
  Array.from({ length: count }, (_, i) => ({
    sys: {
      id: `entry-${offset + i}`,
      contentType: { sys: { id: 'building' } },
      publishedVersion: 1,
      version: 2,
    },
    fields: {
      name: { 'en-US': `Building ${offset + i}` },
      status: { 'en-US': 'Published' },
      location: { 'en-US': { lat: 39.73923, lon: -104.99025 } },
      size: { 'en-US': 1200 },
      cost: { 'en-US': 550000 },
    },
  }));

const mockContentType = {
  sys: { id: 'building' },
  name: 'Building',
  fields: [
    { id: 'name', name: 'Name', type: 'Symbol' },
    { id: 'location', name: 'Location', type: 'Location' },
    { id: 'size', name: 'Size', type: 'Number' },
    { id: 'cost', name: 'Cost', type: 'Number' },
  ],
};

describe('Page Pagination', () => {
  beforeEach(() => {
    mockSdk.cma.contentType.getMany.mockResolvedValue({ items: [mockContentType] });
    mockSdk.cma.contentType.get.mockResolvedValue(mockContentType);
    mockSdk.cma.entry.getMany.mockImplementation(({ query }) => {
      const skip = query?.skip || 0;
      const limit = query?.limit || 15;
      const total = 60;
      return Promise.resolve({
        items: mockEntries(Math.min(limit, total - skip), skip),
        total,
      });
    });
  });

  it('fetches next page of entries when next page is clicked', async () => {
    render(<Page />);
    await waitFor(() => expect(screen.getByTestId('bulk-edit-table')).toBeInTheDocument());
    // Wait for any pagination button to appear
    const nextBtn = await screen.findByRole('button', { name: /next/i });
    fireEvent.click(nextBtn);
    await waitFor(() => expect(screen.getByText('Building 15')).toBeInTheDocument());
    expect(screen.getByText('Building 29')).toBeInTheDocument();
    expect(screen.queryByText('Building 0')).not.toBeInTheDocument();
  });
});
