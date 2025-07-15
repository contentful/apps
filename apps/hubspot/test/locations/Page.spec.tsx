import React from 'react';
import { render, waitFor, screen, cleanup, fireEvent } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect, afterEach } from 'vitest';
import Page from '../../src/locations/Page';

const mockNavigator = { openEntry: vi.fn() };
const mockSdk = {
  cmaAdapter: {},
  ids: { environment: 'env', space: 'space' },
  locales: { default: 'en-US' },
  navigator: mockNavigator,
};

const mockCma = {
  entry: {
    get: vi.fn(),
  },
  contentType: {
    get: vi.fn(),
  },
};

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

vi.mock('contentful-management', () => ({
  createClient: () => mockCma,
}));

const mockGetConnectedFields = vi.fn();
vi.mock('../../src/utils/ConfigEntryService', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      getConnectedFields: mockGetConnectedFields,
    })),
  };
});

describe('Page Location', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading state initially', () => {
    mockGetConnectedFields.mockReturnValue(new Promise(() => {}));

    render(<Page />);

    expect(screen.getByText(/Loading.../i)).toBeTruthy();
  });

  it('renders empty table if no connected entries', async () => {
    mockGetConnectedFields.mockResolvedValue({});

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText('Hubspot')).toBeTruthy();
      expect(
        screen.getByText(
          /View the details of your synced entry fields. Click Manage fields to connect or disconnect content./i
        )
      ).toBeTruthy();
      expect(screen.getByText('No active Hubspot modules')).toBeTruthy();
      expect(
        screen.getByText('Once you have created modules, they will display here.')
      ).toBeTruthy();
      expect(screen.queryByRole('row', { name: /Manage fields/i })).toBeNull();
    });
  });

  it('renders connected entries table if entries exist', async () => {
    mockGetConnectedFields.mockResolvedValue({
      'entry-1': [
        { fieldId: 'title', moduleName: 'mod1', updatedAt: '2024-05-01T10:00:00Z' },
        { fieldId: 'desc', moduleName: 'mod2', updatedAt: '2024-05-01T10:00:00Z' },
      ],
      'entry-2': [
        {
          fieldId: 'title',
          moduleName: 'mod1',
          updatedAt: '2024-05-01T10:00:00Z',
        },
      ],
    });
    mockCma.entry.get
      .mockResolvedValueOnce({
        sys: {
          id: 'entry-1',
          contentType: { sys: { id: 'ct1', name: 'Fruits' } },
          updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          publishedAt: new Date().toISOString(),
        },
        fields: { title: { 'en-US': 'Banana' } },
      })
      .mockResolvedValueOnce({
        sys: {
          id: 'entry-2',
          contentType: { sys: { id: 'ct2', name: 'Animals' } },
          updatedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
          publishedAt: undefined,
        },
        fields: { title: { 'en-US': 'Dog' } },
      });
    mockCma.contentType.get.mockResolvedValue({ displayField: 'title' });

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText('Banana')).toBeTruthy();
      expect(screen.getByText('Dog')).toBeTruthy();
      expect(screen.getByText('Fruits')).toBeTruthy();
      expect(screen.getByText('Animals')).toBeTruthy();
      expect(screen.getByText('Published')).toBeTruthy();
      expect(screen.getByText('Draft')).toBeTruthy();
      expect(screen.getAllByText('Manage fields').length).toBe(2);
      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.getByText('1')).toBeTruthy();
    });
  });

  it('calls openEntry when Manage fields is clicked', async () => {
    mockGetConnectedFields.mockResolvedValue({
      'entry-1': [{ fieldId: 'title', moduleName: 'mod1', updatedAt: '2024-05-01T10:00:00Z' }],
    });
    mockCma.entry.get.mockResolvedValueOnce({
      sys: {
        id: 'entry-1',
        contentType: { sys: { id: 'ct1', name: 'Fruits' } },
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
      },
      fields: { title: { 'en-US': 'Banana' } },
    });
    mockCma.contentType.get.mockResolvedValue({ displayField: 'title' });

    render(<Page />);
    const btn = await screen.findByRole('button', { name: /Manage fields/i });
    fireEvent.click(btn);
    expect(mockNavigator.openEntry).toHaveBeenCalledWith('entry-1');
  });
});
