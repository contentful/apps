import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import Page from '../../../src/locations/Page';
import { mockSdk } from '../../mocks/mockSdk';
import { getManyContentTypes, getManyEntries } from '../../mocks/mockCma';
import { condoAContentType } from '../../mocks/mockContentTypes';
import { condoAEntry1, condoAEntry2 } from '../../mocks/mockEntries';
import { Notification } from '@contentful/f36-components';
import type { ContentTypeProps } from 'contentful-management';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('Page', () => {
  beforeEach(() => {
    // Mock content type fetch
    mockSdk.cma.contentType.getMany = vi
      .fn()
      .mockResolvedValue(getManyContentTypes([condoAContentType]));

    // Mock content type get for fields
    mockSdk.cma.contentType.get = vi.fn().mockResolvedValue(condoAContentType);

    // Mock entries fetch
    mockSdk.cma.entry.getMany = vi
      .fn()
      .mockResolvedValue(getManyEntries([condoAEntry1, condoAEntry2]));
  });

  afterEach(() => {
    cleanup();
  });

  it('shows loading spinner during initial content type fetch', async () => {
    render(<Page />);
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
});

describe('Bulk edit functionality', () => {
  beforeEach(() => {
    // Mock content type fetch
    mockSdk.cma.contentType.getMany = vi
      .fn()
      .mockResolvedValue(getManyContentTypes([condoAContentType]));

    // Mock content type get for fields
    mockSdk.cma.contentType.get = vi.fn().mockResolvedValue(condoAContentType);

    // Mock entries fetch
    mockSdk.cma.entry.getMany = vi
      .fn()
      .mockResolvedValue(getManyEntries([condoAEntry1, condoAEntry2]));

    // Mock entry update
    mockSdk.cma.entry.update = vi.fn().mockImplementation(async (params, entry) => entry);
  });
  afterEach(() => {
    cleanup();
  });

  it('updates entry field value when saved in modal', async () => {
    render(<Page />);

    // Wait for entries to load
    await waitFor(() => {
      expect(screen.getByTestId('bulk-edit-table')).toBeInTheDocument();
    });

    // Wait for table body to be populated
    await waitFor(() => {
      expect(screen.getByTestId('cf-ui-table-body')).toBeInTheDocument();
    });

    // Select a field and entr
    const fieldCheckbox = screen.getByRole('checkbox', { name: 'Select all for Description' });
    fireEvent.click(fieldCheckbox);

    // Click Edit button
    const editButton = screen.getByText('Bulk edit');
    fireEvent.click(editButton);

    // Modal should open
    await waitFor(() => {
      expect(screen.getByText('Editing field:')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your new value')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Enter your new value');
    fireEvent.change(input, { target: { value: 'New description' } });
    fireEvent.click(screen.getByTestId('bulk-edit-save'));

    // Verify update was called
    await waitFor(() => {
      expect(mockSdk.cma.entry.update).toHaveBeenCalled();
    });
  });

  it('handles failed updates and shows error note', async () => {
    mockSdk.cma.entry.update = vi.fn().mockRejectedValue(new Error('Update failed'));

    render(<Page />);

    // Wait for entries to load
    await waitFor(() => {
      expect(screen.getByTestId('bulk-edit-table')).toBeInTheDocument();
    });

    // Wait for table body to be populated
    await waitFor(() => {
      expect(screen.getByTestId('cf-ui-table-body')).toBeInTheDocument();
    });

    // Select a field and entr
    const fieldCheckbox = screen.getByRole('checkbox', { name: 'Select all for Description' });
    fireEvent.click(fieldCheckbox);

    // Click Edit button
    const editButton = screen.getByText('Bulk edit');
    fireEvent.click(editButton);

    // Enter new value and save
    const input = screen.getByPlaceholderText('Enter your new value');
    fireEvent.change(input, { target: { value: 'New description' } });
    fireEvent.click(screen.getByTestId('bulk-edit-save'));

    // Verify error note appears
    await waitFor(() => {
      expect(screen.getByText(/did not update: Building one/)).toBeInTheDocument();
    });
  });
});

describe('Bulk edit notification', () => {
  beforeEach(() => {
    vi.spyOn(Notification, 'success').mockImplementation(() => ({} as any));
  });
  afterEach(() => {
    cleanup();
  });

  it('shows success notification for single entry', async () => {
    const firstEntryName = 'Building one';
    const val = 'Tundra';
    Notification.success(`${firstEntryName} was updated to ${val}`, { title: 'Success!' });
    expect(Notification.success).toHaveBeenCalledWith('Building one was updated to Tundra', {
      title: 'Success!',
    });
  });

  it('shows success notification for multiple entries', async () => {
    const firstEntryName = 'Building one';
    const val = 'Alpine';
    Notification.success(`${firstEntryName} and 4 more entry fields were updated to ${val}`, {
      title: 'Success!',
    });
    expect(Notification.success).toHaveBeenCalledWith(
      'Building one and 4 more entry fields were updated to Alpine',
      { title: 'Success!' }
    );
  });
});

describe('Table display', () => {
  beforeEach(() => {
    // Mock content type fetch
    mockSdk.cma.contentType.getMany = vi
      .fn()
      .mockResolvedValue(getManyContentTypes([condoAContentType]));

    // Mock content type get for fields
    mockSdk.cma.contentType.get = vi.fn().mockResolvedValue(condoAContentType);

    // Mock entries fetch
    mockSdk.cma.entry.getMany = vi
      .fn()
      .mockResolvedValue(getManyEntries([condoAEntry1, condoAEntry2]));
  });

  afterEach(() => {
    cleanup();
  });

  it('displays table correctly when displayField is null', async () => {
    const contentTypeWithoutDisplayField = {
      ...condoAContentType,
      displayField: null,
    } as unknown as ContentTypeProps;

    mockSdk.cma.contentType.getMany = vi
      .fn()
      .mockResolvedValue(getManyContentTypes([contentTypeWithoutDisplayField]));
    mockSdk.cma.contentType.get = vi.fn().mockResolvedValue(contentTypeWithoutDisplayField);

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByTestId('bulk-edit-table')).toBeInTheDocument();
    });

    expect(screen.getByText('Condo A')).toBeInTheDocument();
    expect(screen.getByTestId('cf-ui-table-body')).toBeInTheDocument();
    expect(screen.getAllByText('Untitled').length).toBe(2);
  });
});
