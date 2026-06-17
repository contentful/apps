import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { EntryProps } from 'contentful-management';
import { SummaryModal } from '../../../../../src/locations/Page/components/modals/SummaryModal';
import { createMockSDK } from '../../../../mocks';
import type { PageAppSDK } from '@contentful/app-sdk';
import React from 'react';

const onDone = vi.fn();

describe('SummaryModal', () => {
  let mockSdk: PageAppSDK;

  const map = new Map([['blogPost', { name: 'Page: Event Detail', displayField: 'title' }]]);

  const entries: EntryProps[] = [
    {
      sys: {
        id: 'entry-1',
        type: 'Entry',
        contentType: { sys: { id: 'blogPost', type: 'Link', linkType: 'ContentType' } },
      },
      fields: { title: { 'en-US': "Don't enter NRF uncaffeinated" } },
    } as unknown as EntryProps,
    {
      sys: {
        id: 'entry-2',
        type: 'Entry',
        contentType: { sys: { id: 'blogPost', type: 'Link', linkType: 'ContentType' } },
      },
      fields: { title: { 'en-US': "Don't enter NRF uncaffeinated" } },
    } as unknown as EntryProps,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk = createMockSDK() as PageAppSDK;
  });

  it('renders title and success message with entry count', async () => {
    render(
      <SummaryModal
        isOpen={true}
        sdk={mockSdk}
        entries={entries}
        contentTypeDisplayInfoMap={map}
        defaultLocale="en-US"
        onDone={onDone}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Entries created' })).toBeTruthy();
      expect(
        screen.getByText('Success! 2 entries have been created:', { exact: false })
      ).toBeTruthy();
    });
  });

  it('calls onDone when Done is clicked', async () => {
    render(
      <SummaryModal
        isOpen={true}
        sdk={mockSdk}
        entries={entries}
        contentTypeDisplayInfoMap={map}
        defaultLocale="en-US"
        onDone={onDone}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Done' }));

    await waitFor(() => {
      expect(onDone).toHaveBeenCalledTimes(1);
    });
  });

  it('calls navigator.openEntry when a card is activated', async () => {
    render(
      <SummaryModal
        isOpen={true}
        sdk={mockSdk}
        entries={entries}
        contentTypeDisplayInfoMap={map}
        defaultLocale="en-US"
        onDone={onDone}
      />
    );

    const entryCards = screen.getAllByRole('button', {
      name: /Open entry .* \(entry-/,
    });
    fireEvent.click(entryCards[0]);

    await waitFor(() => {
      expect(mockSdk.navigator.openEntry).toHaveBeenCalledWith('entry-1', { slideIn: true });
    });
  });

  it('renders singular copy for one entry', async () => {
    render(
      <SummaryModal
        isOpen={true}
        sdk={mockSdk}
        entries={[entries[0]]}
        contentTypeDisplayInfoMap={map}
        defaultLocale="en-US"
        onDone={onDone}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Success! 1 entry has been created:', { exact: false })).toBeTruthy();
    });
  });
});
