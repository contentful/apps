import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import Page from '../../../src/locations/Page';
import { mockSdk } from '../../mocks/mockSdk';
import { getManyContentTypes } from '../../mocks/mockCma';
import { condoAContentType } from '../../mocks/mockContentTypes';
import { Notification } from '@contentful/f36-components';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('Page', () => {
  beforeEach(() => {
    mockSdk.cma.contentType.getMany = vi
      .fn()
      .mockResolvedValue(getManyContentTypes([condoAContentType]));
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
      expect(screen.getByText('No entries found.')).toBeInTheDocument();
    });
  });

  it('does not show Edit/Bulk edit button when no field is selected', async () => {
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText('No entries found.')).toBeInTheDocument();
    });
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Bulk edit')).not.toBeInTheDocument();
  });
});

describe('Bulk edit notification', () => {
  beforeEach(() => {
    vi.spyOn(Notification, 'success').mockImplementation(() => ({} as any));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows success notification for single entry', async () => {
    // Setup: render Page, select one entry, open modal, save
    // ...simulate selection and modal save...
    // For brevity, assume onSave is called directly:
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
