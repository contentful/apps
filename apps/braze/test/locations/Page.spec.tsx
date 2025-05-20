import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import Page from '../../src/locations/Page';
import { mockSdk, mockCma } from '../mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

const mockEntries = [
  {
    sys: { id: '1', updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
    fields: {
      name: { 'en-US': 'Banana' },
      contentType: { 'en-US': 'Fruits' },
      status: { 'en-US': 'published' },
      connectedFields: {
        'en-US': {
          '2UaU3B1eRMxStWNQ1Pkv7f': [
            { fieldId: 'name', contentBlockId: 'de9aacf2-7e95-4bf6-be3a-296380760ac0' },
            { fieldId: 'name', contentBlockId: '875eb453-86cd-4cb8-a302-40e99cae6550' },
          ],
        },
      },
    },
  },
  {
    sys: { id: '2', updatedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString() },
    fields: {
      name: { 'en-US': 'Dogs' },
      contentType: { 'en-US': 'Animals' },
      status: { 'en-US': 'draft' },
      connectedFields: {
        'en-US': {
          '2UaU3B1eRMxStWNQ1Pkv7f': [
            { fieldId: 'name', contentBlockId: 'de9aacf2-7e95-4bf6-be3a-296380760ac0' },
            { fieldId: 'lastname', contentBlockId: '572c6425-10cf-4fd5-aae1-84357e7c13cc' },
            { fieldId: 'type', contentBlockId: '875eb453-86cd-4cb8-a302-40e99cae6550' },
          ],
        },
      },
    },
  },
  {
    sys: { id: '3', updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
    fields: {
      name: { 'en-US': 'Cats' },
      contentType: { 'en-US': 'Animals' },
      status: { 'en-US': 'published' },
      connectedFields: {
        'en-US': {
          '2UaU3B1eRMxStWNQ1Pkv7f': [
            { fieldId: 'name', contentBlockId: 'de9aacf2-7e95-4bf6-be3a-296380760ac0' },
            { fieldId: 'type', contentBlockId: '875eb453-86cd-4cb8-a302-40e99cae6550' },
          ],
        },
      },
    },
  },
  {
    sys: { id: '4', updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
    fields: {
      name: { 'en-US': 'Cars' },
      contentType: { 'en-US': 'Things that go' },
      status: { 'en-US': 'published' },
      connectedFields: {
        'en-US': {
          '2UaU3B1eRMxStWNQ1Pkv7f': [
            { fieldId: 'name', contentBlockId: 'de9aacf2-7e95-4bf6-be3a-296380760ac0' },
            { fieldId: 'type', contentBlockId: '875eb453-86cd-4cb8-a302-40e99cae6550' },
            { fieldId: 'model', contentBlockId: '572c6425-10cf-4fd5-aae1-84357e7c13cc' },
            { fieldId: 'brand', contentBlockId: '572c6425-10cf-4fd5-aae1-84357e7c13cc' },
            { fieldId: 'year', contentBlockId: '572c6425-10cf-4fd5-aae1-84357e7c13cc' },
            { fieldId: 'color', contentBlockId: '572c6425-10cf-4fd5-aae1-84357e7c13cc' },
            { fieldId: 'doors', contentBlockId: '572c6425-10cf-4fd5-aae1-84357e7c13cc' },
            { fieldId: 'wheels', contentBlockId: '572c6425-10cf-4fd5-aae1-84357e7c13cc' },
            { fieldId: 'engine', contentBlockId: '572c6425-10cf-4fd5-aae1-84357e7c13cc' },
            { fieldId: 'fuel', contentBlockId: '572c6425-10cf-4fd5-aae1-84357e7c13cc' },
          ],
        },
      },
    },
  },
  {
    sys: { id: '5', updatedAt: '2025-02-26T00:00:00.000Z' },
    fields: {
      name: { 'en-US': 'Trucks' },
      contentType: { 'en-US': 'Things that go' },
      status: { 'en-US': 'draft' },
      connectedFields: {
        'en-US': {
          '2UaU3B1eRMxStWNQ1Pkv7f': [
            { fieldId: 'name', contentBlockId: 'de9aacf2-7e95-4bf6-be3a-296380760ac0' },
            { fieldId: 'type', contentBlockId: '875eb453-86cd-4cb8-a302-40e99cae6550' },
            { fieldId: 'model', contentBlockId: '572c6425-10cf-4fd5-aae1-84357e7c13cc' },
            { fieldId: 'brand', contentBlockId: '572c6425-10cf-4fd5-aae1-84357e7c13cc' },
            { fieldId: 'year', contentBlockId: '572c6425-10cf-4fd5-aae1-84357e7c13cc' },
          ],
        },
      },
    },
  },
];

const fetchEntriesMock = vi.fn();

vi.mock('../../src/utils/fetchBrazeConnectedEntries', () => ({
  fetchBrazeConnectedEntries: fetchEntriesMock,
}));

describe('Page component', () => {
  beforeEach(() => {
    fetchEntriesMock.mockResolvedValue(mockEntries);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the title, description, and help link', async () => {
    render(<Page />);
    expect(await screen.findByText('Braze Content Blocks')).toBeTruthy();
    expect(screen.getByText('Content connected to Braze through Content Blocks')).toBeTruthy();
    const helpLink = screen.getByRole('link', { name: /here/i });
    expect(helpLink.getAttribute('href')).toContain('braze.com');
  });

  it('renders the table headers', async () => {
    render(<Page />);
    expect(await screen.findByText('Entry name')).toBeTruthy();
    expect(screen.getByText('Content type')).toBeTruthy();
    expect(screen.getByText('Updated')).toBeTruthy();
    expect(screen.getByText('Status')).toBeTruthy();
    expect(screen.getByText('Connected fields')).toBeTruthy();
  });

  it('renders the correct number of rows and data', async () => {
    render(<Page />);
    for (const entry of mockEntries) {
      expect(await screen.findByText(entry.fields.name['en-US'])).toBeTruthy();
      expect(screen.getByText(entry.fields.contentType['en-US'])).toBeTruthy();
    }
    // Check connected fields count
    expect(screen.getByText('2')).toBeTruthy(); // Banana
    expect(screen.getByText('3')).toBeTruthy(); // Dogs
    expect(screen.getByText('10')).toBeTruthy(); // Cars
    expect(screen.getByText('5')).toBeTruthy(); // Trucks
  });

  it('renders status badges correctly', async () => {
    render(<Page />);
    expect(await screen.findByText('Published')).toBeTruthy();
    expect(screen.getAllByText('Published').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Draft').length).toBeGreaterThan(0);
  });

  it('renders the action button for each row', async () => {
    render(<Page />);
    const buttons = await screen.findAllByRole('button', { name: /View fields/i });
    expect(buttons.length).toBe(mockEntries.length);
  });

  it('calls navigator when action button is clicked', async () => {
    render(<Page />);
    const buttons = await screen.findAllByRole('button', { name: /View fields/i });
    fireEvent.click(buttons[0]);
    expect(mockSdk.navigator.openCurrentAppPage).toHaveBeenCalled();
  });

  it('shows a message if there are no connected entries', async () => {
    fetchEntriesMock.mockResolvedValueOnce([]);
    render(<Page />);
    expect(await screen.findByText(/no connected entries/i)).toBeTruthy();
  });

  /*it('shows a loading state while fetching', async () => {
    let resolveFn;
    fetchEntriesMock.mockReturnValue(new Promise((resolve) => { resolveFn = resolve; }));
    render(<Page />);
    expect(screen.getByText(/loading/i)).toBeTruthy();
    resolveFn([]);
    await waitFor(() => expect(screen.queryByText(/loading/i)).toBeNull());
  });*/

  it('shows an error state if fetch fails', async () => {
    fetchEntriesMock.mockRejectedValueOnce(new Error('Failed to fetch'));
    render(<Page />);
    expect(await screen.findByText(/error/i)).toBeTruthy();
  });
});
