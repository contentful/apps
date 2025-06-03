import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect, afterEach } from 'vitest';
import Page from '../../../src/locations/Page';
import { mockSdk } from '../../mocks/mockSdk';
import { createMockCma } from '../../mocks/mockCma';

// Correctly mock Forma 36 NavList component
// Mock useSDK to return mockSdk
vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

const mockContentTypes = [
  {
    sys: { id: 'condoC' },
    name: 'Condo C',
    fields: [
      { id: 'displayName', name: 'Display Name' },
      { id: 'description', name: 'Description' },
    ],
  },
  {
    sys: { id: 'condoA' },
    name: 'Condo A',
    fields: [
      { id: 'displayName', name: 'Display Name' },
      { id: 'description', name: 'Description' },
    ],
  },
  {
    sys: { id: 'condoB' },
    name: 'Condo B',
    fields: [
      { id: 'displayName', name: 'Display Name' },
      { id: 'description', name: 'Description' },
    ],
  },
];

// Realistic Contentful entry mock structure
const mockEntries = {
  condoA: [
    {
      sys: { id: '1', contentType: { sys: { id: 'condoA' } }, version: 1 },
      fields: { displayName: { 'en-US': 'Building one' } },
    },
    {
      sys: { id: '2', contentType: { sys: { id: 'condoA' } }, publishedVersion: 1, version: 2 },
      fields: { displayName: { 'en-US': 'Building two' } },
    },
    {
      sys: { id: '3', contentType: { sys: { id: 'condoA' } }, publishedVersion: 2, version: 4 },
      fields: { displayName: { 'en-US': 'Building three' } },
    },
  ],
  condoB: [
    {
      sys: { id: '4', contentType: { sys: { id: 'condoB' } }, version: 1 },
      fields: { displayName: { 'en-US': 'B1' } },
    },
    {
      sys: { id: '5', contentType: { sys: { id: 'condoB' } }, publishedVersion: 1, version: 2 },
      fields: { displayName: { 'en-US': 'B2' } },
    },
    {
      sys: { id: '6', contentType: { sys: { id: 'condoB' } }, publishedVersion: 2, version: 4 },
      fields: { displayName: { 'en-US': 'B3' } },
    },
  ],
  condoC: [
    {
      sys: { id: '7', contentType: { sys: { id: 'condoC' } }, version: 1 },
      fields: { displayName: { 'en-US': 'C1' } },
    },
    {
      sys: { id: '8', contentType: { sys: { id: 'condoC' } }, publishedVersion: 1, version: 2 },
      fields: { displayName: { 'en-US': 'C2' } },
    },
    {
      sys: { id: '9', contentType: { sys: { id: 'condoC' } }, publishedVersion: 2, version: 4 },
      fields: { displayName: { 'en-US': 'C3' } },
    },
  ],
};

describe('Page Navigation', () => {
  beforeEach(() => {
    mockSdk.cma = createMockCma();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders sidebar with all content types', async () => {
    render(<Page />);
    const nav = await screen.findAllByTestId('content-types-nav');
    expect(nav).toBeTruthy();
    expect(screen.getByText('Condo A')).toBeTruthy();
    expect(screen.getByText('Condo B')).toBeTruthy();
    expect(screen.getByText('Condo C')).toBeTruthy();
  });

  it('sorts content types alphabetically in the sidebar', async () => {
    render(<Page />);
    const items = await screen.findAllByTestId('content-type-nav-item');
    const texts = items.map((el) => el.textContent);
    expect(texts).toEqual(['Condo A', 'Condo B', 'Condo C']);
  });

  it('changes title when selecting a different content type', async () => {
    render(<Page />);
    expect(await screen.findByText('Bulk edit Condo A')).toBeTruthy();
    fireEvent.click(screen.getByText('Condo B'));
    expect(await screen.findByText('Bulk edit Condo B')).toBeTruthy();
  });
});
