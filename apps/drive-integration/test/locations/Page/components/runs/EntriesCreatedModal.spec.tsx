import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { EntryProps } from 'contentful-management';
import type { PageAppSDK } from '@contentful/app-sdk';
import { EntriesCreatedModal } from '../../../../../src/locations/Page/components/runs/EntriesCreatedModal';
import { createMockSDK } from '../../../../mocks';

const makeEntry = (id: string): EntryProps =>
  ({
    sys: {
      id,
      type: 'Entry',
      version: 1,
      contentType: { sys: { id: 'blogPost', type: 'Link', linkType: 'ContentType' } },
    },
    fields: { title: { 'en-US': `Title ${id}` } },
  } as unknown as EntryProps);

describe('EntriesCreatedModal', () => {
  let mockSdk: PageAppSDK;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk = createMockSDK() as PageAppSDK;
    (mockSdk.cma.contentType.getMany as any).mockResolvedValue({
      items: [{ sys: { id: 'blogPost' }, name: 'Blog Post', displayField: 'title' }],
      total: 1,
    });
  });

  afterEach(() => cleanup());

  it('shows a missing-entries note instead of a blank modal when every entry was deleted', async () => {
    (mockSdk.cma.entry.get as any).mockRejectedValue({ code: 'NotFound' });

    render(
      <EntriesCreatedModal
        isOpen={true}
        onClose={vi.fn()}
        sdk={mockSdk}
        entryIds={['entry-1', 'entry-2']}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          'All 2 entries created by this run are no longer available. They were likely deleted from this space or environment.'
        )
      ).toBeTruthy();
    });
  });

  it('shows a partial note alongside the surviving entries', async () => {
    (mockSdk.cma.entry.get as any).mockImplementation(({ entryId }: { entryId: string }) =>
      entryId === 'entry-1'
        ? Promise.resolve(makeEntry(entryId))
        : Promise.reject({ code: 'NotFound' })
    );

    render(
      <EntriesCreatedModal
        isOpen={true}
        onClose={vi.fn()}
        sdk={mockSdk}
        entryIds={['entry-1', 'entry-2']}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(/1 of the 2 entries created by this run is no longer available/)
      ).toBeTruthy();
      expect(screen.getByText('Title entry-1')).toBeTruthy();
    });
  });
});
