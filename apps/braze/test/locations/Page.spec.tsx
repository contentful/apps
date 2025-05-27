import React from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { render, waitFor, screen, cleanup } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect, Mock, afterEach } from 'vitest';
import Page from '../../src/locations/Page';
import { fetchBrazeConnectedEntries } from '../../src/utils/fetchBrazeConnectedEntries';
import { BasicField } from '../../src/fields/BasicField';
import { Entry } from '../../src/fields/Entry';
import { mockSdk } from '../mocks';

describe('Page Location', () => {
  vi.mock('@contentful/react-apps-toolkit');
  vi.mock('../../src/utils/fetchBrazeConnectedEntries');
  vi.mock('contentful-management', () => ({
    createClient: vi.fn(() => ({})),
  }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Page component', () => {
    const title = new BasicField('title', 'Title', 'content-type-id', true);
    const author = new BasicField('author', 'Author', 'content-type-id', true);

    beforeEach(() => {
      (useSDK as unknown as Mock).mockReturnValue(mockSdk);
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

  describe('Connected Fields Modal', () => {
    const title = new BasicField('title', 'Title', 'content-type-id', true);
    const description = new BasicField('description', 'Description', 'content-type-id', false);
    const checkbox = new BasicField('checkbox', 'Checkbox', 'content-type-id', false);
    const entry = new Entry(
      'entry-id',
      'content-type-id',
      'title',
      [title, description, checkbox],
      'space-id',
      'environment-id',
      'valid-contentful-api-key',
      '2025-05-15T16:49:16.367Z',
      '2025-05-15T16:49:16.367Z'
    );

    beforeEach(() => {
      (useSDK as unknown as Mock).mockReturnValue(mockSdk);
      (fetchBrazeConnectedEntries as Mock).mockResolvedValue([entry]);
    });

    it('opens modal when View fields is clicked', async () => {
      render(<Page />);
      const viewFieldsButton = (await screen.findAllByRole('button', { name: /View fields/i }))[0];
      viewFieldsButton.click();
      const modal = await screen.findByRole('dialog');

      expect(modal).toBeTruthy();
      expect(screen.getByText('View entry')).toBeTruthy();
    });

    it('displays entry name, connected fields count, and View entry button', async () => {
      render(<Page />);
      const viewFieldsButton = (await screen.findAllByRole('button', { name: /View fields/i }))[0];
      viewFieldsButton.click();
      await screen.findByRole('dialog');

      expect(screen.getByTestId('modal-entry-title')).toBeTruthy();
      expect(screen.getByTestId('modal-fields-length')).toBeTruthy();
      expect(screen.getByText('View entry')).toBeTruthy();
    });

    it('lists all connected fields with checkboxes', async () => {
      render(<Page />);
      const viewFieldsButton = (await screen.findAllByRole('button', { name: /View fields/i }))[0];
      viewFieldsButton.click();
      await screen.findByRole('dialog');
      expect(screen.getByText('Title')).toBeTruthy();
      expect(screen.getByText('Description')).toBeTruthy();
      expect(screen.getByText('Checkbox')).toBeTruthy();
      // Checkboxes for each field
      expect(screen.getByLabelText('Title')).toBeTruthy();
      expect(screen.getByLabelText('Description')).toBeTruthy();
      expect(screen.getByLabelText('Checkbox')).toBeTruthy();
    });

    it('selects/deselects all fields with header checkbox', async () => {
      render(<Page />);
      const viewFieldsButton = (await screen.findAllByRole('button', { name: /View fields/i }))[0];
      viewFieldsButton.click();
      await screen.findByRole('dialog');
      const selectAll = screen.getByTestId('select-all-fields');
      // Select all
      selectAll.click();
      expect((screen.getByLabelText('Title') as HTMLInputElement).checked).toBe(true);
      expect((screen.getByLabelText('Description') as HTMLInputElement).checked).toBe(true);
      expect((screen.getByLabelText('Checkbox') as HTMLInputElement).checked).toBe(true);
      // Deselect all
      selectAll.click();
      expect((screen.getByLabelText('Title') as HTMLInputElement).checked).toBe(false);
      expect((screen.getByLabelText('Description') as HTMLInputElement).checked).toBe(false);
      expect((screen.getByLabelText('Checkbox') as HTMLInputElement).checked).toBe(false);
    });

    it('toggles individual field selection', async () => {
      render(<Page />);
      const viewFieldsButton = (await screen.findAllByRole('button', { name: /View fields/i }))[0];
      viewFieldsButton.click();
      await screen.findByRole('dialog');
      const titleCheckbox = screen.getByLabelText('Title') as HTMLInputElement;
      expect(titleCheckbox.checked).toBe(false);
      titleCheckbox.click();
      expect(titleCheckbox.checked).toBe(true);
      titleCheckbox.click();
      expect(titleCheckbox.checked).toBe(false);
    });

    it('calls navigation when View entry is clicked', async () => {
      render(<Page />);
      const viewFieldsButton = (await screen.findAllByRole('button', { name: /View fields/i }))[0];
      viewFieldsButton.click();
      await screen.findByRole('dialog');
      screen.getByRole('button', { name: /View entry/i }).click();
      expect(mockSdk.navigator.openEntry).toHaveBeenCalledWith('entry-id');
    });
  });
});
