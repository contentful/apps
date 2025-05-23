import { useSDK } from '@contentful/react-apps-toolkit';
import { render, waitFor, screen } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect, Mock, afterEach } from 'vitest';
import Page from '../../src/locations/Page';
import { fetchBrazeConnectedEntries } from '../../src/utils/fetchBrazeConnectedEntries';
import { BasicField } from '../../src/fields/BasicField';
import { Entry } from '../../src/fields/Entry';
import { mockSdk } from '../mocks/mockSdk';

vi.mock('@contentful/react-apps-toolkit');
vi.mock('../../src/utils/fetchBrazeConnectedEntries');
vi.mock('contentful-management', () => ({
  createClient: vi.fn(() => ({})),
}));

describe('Page', () => {
  const title = new BasicField('title', 'Title', 'content-type-id', true);
  const author = new BasicField('author', 'Author', 'content-type-id', true);
  beforeEach(() => {
    vi.clearAllMocks();
    (useSDK as unknown as Mock).mockReturnValue(mockSdk);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (fetchBrazeConnectedEntries as Mock).mockReturnValue(new Promise(() => {}));
    render(<Page />);
    expect(screen.getByText(/Loading.../i)).toBeTruthy();
  });

  it('renders error state if fetch fails', async () => {
    (fetchBrazeConnectedEntries as Mock).mockRejectedValue(new Error('fail'));
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText(/There was an error/i)).toBeTruthy();
      expect(screen.getByText(/Please contact support/i)).toBeTruthy();
    });
  });

  it('renders empty state if no entries', async () => {
    (fetchBrazeConnectedEntries as Mock).mockResolvedValue([]);
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText(/No active Braze Content Blocks/i)).toBeTruthy();
      expect(
        screen.getByText(/Once you have created Content Blocks, they will display here./i)
      ).toBeTruthy();
    });
  });

  it('renders connected entries table if entries exist', async () => {
    const publishEntry = new Entry(
      'entry-id',
      'content-type-id',
      'Title',
      [title, author],
      'space-id',
      'environment-id',
      'valid-contentful-api-key',
      '2025-05-15T16:49:16.367Z',
      '2025-05-15T16:49:16.367Z'
    );
    (fetchBrazeConnectedEntries as Mock).mockResolvedValue([publishEntry]);
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText(/Content connected to Braze/i)).toBeTruthy();
      expect(screen.getByText(/Title/i)).toBeTruthy();
      expect(screen.getByText(/Published/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /View fields/i })).toBeTruthy();
    });
  });

  it('shows correct badge for draft status', async () => {
    const draftEntry = new Entry(
      'entry-id',
      'content-type-id',
      'Title',
      [title, author],
      'space-id',
      'environment-id',
      'valid-contentful-api-key',
      '',
      '2025-05-15T16:49:16.367Z'
    );
    (fetchBrazeConnectedEntries as Mock).mockResolvedValue([draftEntry]);

    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText(/Draft/i)).toBeTruthy();
    });
  });
});
