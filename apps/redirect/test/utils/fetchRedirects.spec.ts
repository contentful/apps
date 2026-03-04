import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fetchRedirects, FetchRedirectsResult } from '../../src/utils/fetchRedirects';
import { REDIRECT_CONTENT_TYPE_ID } from '../../src/utils/consts';
import { EntryProps } from 'contentful-management';
import { mockCma, mockSdk } from '../mocks';

import {
  createMockContentType,
  createMockEditorInterface,
  createMockReferencedEntry,
} from './testUtils';

describe('fetchRedirects', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockCma.contentType.getMany.mockResolvedValue({ items: [] });
    mockCma.editorInterface.getMany.mockResolvedValue({ items: [] });
  });

  it('calls sdk.cma.entry.getMany with correct query', async () => {
    mockCma.entry.getMany.mockResolvedValue({
      items: [],
      total: 0,
      limit: 100,
      skip: 0,
      sys: { type: 'Array' },
    });

    await fetchRedirects(mockSdk);

    expect(mockCma.entry.getMany).toHaveBeenCalledTimes(1);
    expect(mockCma.entry.getMany).toHaveBeenCalledWith({
      query: {
        limit: 100,
        skip: 0,
        content_type: REDIRECT_CONTENT_TYPE_ID,
      },
    });
  });

  it('returns redirects, total, and fetchedAt from response', async () => {
    const redirectFields = {
      redirectFromContentTypes: {
        'en-US': { sys: { type: 'Link', linkType: 'Entry', id: 'from-1' } },
      },
      redirectToContentTypes: { 'en-US': { sys: { type: 'Link', linkType: 'Entry', id: 'to-1' } } },
    };
    const items: EntryProps[] = [
      createMockReferencedEntry('entry-1', REDIRECT_CONTENT_TYPE_ID, redirectFields),
      createMockReferencedEntry('entry-2', REDIRECT_CONTENT_TYPE_ID, redirectFields),
    ];

    const referencedEntries = [
      createMockReferencedEntry('from-1', 'page', {}),
      createMockReferencedEntry('to-1', 'page', {}),
    ];

    mockCma.entry.getMany
      .mockResolvedValueOnce({
        items,
        total: 2,
        limit: 100,
        skip: 0,
        sys: { type: 'Array' },
      })
      .mockResolvedValueOnce({
        items: referencedEntries,
        total: referencedEntries.length,
        limit: referencedEntries.length,
        skip: 0,
        sys: { type: 'Array' },
      });

    const result = await fetchRedirects(mockSdk);

    expect(result.total).toBe(2);
    expect(result.fetchedAt).toBeInstanceOf(Date);
    expect(result.redirects).toHaveLength(2);
    expect(result.redirects[0].sys.id).toBe('entry-1');
    expect(result.redirects[1].sys.id).toBe('entry-2');
  });

  it('returns empty redirects and total 0 when API returns empty collection', async () => {
    mockCma.entry.getMany.mockResolvedValue({
      items: [],
      total: 0,
      limit: 100,
      skip: 0,
      sys: { type: 'Array' },
    });

    const result: FetchRedirectsResult = await fetchRedirects(mockSdk);

    expect(result.redirects).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.fetchedAt).toBeInstanceOf(Date);
  });

  it('populates titles and slugs from referenced entries when content types and editor interface are available', async () => {
    const redirectFields = {
      redirectFromContentTypes: {
        'en-US': { sys: { type: 'Link', linkType: 'Entry', id: 'from-1' } },
      },
      redirectToContentTypes: { 'en-US': { sys: { type: 'Link', linkType: 'Entry', id: 'to-1' } } },
    };
    const items = [createMockReferencedEntry('entry-1', REDIRECT_CONTENT_TYPE_ID, redirectFields)];

    const referencedEntries = [
      createMockReferencedEntry('from-1', 'page', {
        title: { 'en-US': 'From entry title' },
        pageSlug: { 'en-US': 'from-entry-slug-from-appearance' },
        slug: { 'en-US': 'from-entry-slug-field' },
      }),
      createMockReferencedEntry('to-1', 'page', {
        title: { 'en-US': 'To entry title' },
        pageSlug: { 'en-US': 'to-entry-slug-from-appearance' },
        slug: { 'en-US': 'to-entry-slug-field' },
      }),
    ];

    const contentTypes = [createMockContentType('page', 'title')];
    const editorInterfaces = [createMockEditorInterface('page', 'pageSlug')];

    mockCma.entry.getMany
      .mockResolvedValueOnce({
        items,
        total: items.length,
        limit: 100,
        skip: 0,
        sys: { type: 'Array' },
      })
      .mockResolvedValueOnce({
        items: referencedEntries,
        total: referencedEntries.length,
        limit: referencedEntries.length,
        skip: 0,
        sys: { type: 'Array' },
      });

    mockCma.contentType.getMany.mockResolvedValueOnce({
      items: contentTypes,
    });

    mockCma.editorInterface.getMany.mockResolvedValueOnce({
      items: editorInterfaces,
    });

    const result = await fetchRedirects(mockSdk);
    const redirectedEntry = result.redirects[0];

    expect(redirectedEntry.fields.redirectFromContentTypes.title).toBe('From entry title');
    expect(redirectedEntry.fields.redirectToContentTypes.title).toBe('To entry title');
    expect(redirectedEntry.fields.redirectFromContentTypes.slug).toBe(
      'from-entry-slug-from-appearance'
    );
    expect(redirectedEntry.fields.redirectToContentTypes.slug).toBe(
      'to-entry-slug-from-appearance'
    );
  });

  it('falls back to slug field id when no slug editor is configured', async () => {
    const redirectFields = {
      redirectFromContentTypes: {
        'en-US': { sys: { type: 'Link', linkType: 'Entry', id: 'from-1' } },
      },
      redirectToContentTypes: { 'en-US': { sys: { type: 'Link', linkType: 'Entry', id: 'to-1' } } },
    };
    const items = [createMockReferencedEntry('entry-1', REDIRECT_CONTENT_TYPE_ID, redirectFields)];

    const referencedEntries = [
      createMockReferencedEntry('from-1', 'page', {
        title: { 'en-US': 'From entry title' },
        slug: { 'en-US': 'from-entry-slug-field' },
      }),
      createMockReferencedEntry('to-1', 'page', {
        title: { 'en-US': 'To entry title' },
        slug: { 'en-US': 'to-entry-slug-field' },
      }),
    ];

    const contentTypes = [createMockContentType('page', 'title')];

    mockCma.entry.getMany
      .mockResolvedValueOnce({
        items,
        total: items.length,
        limit: 100,
        skip: 0,
        sys: { type: 'Array' },
      })
      .mockResolvedValueOnce({
        items: referencedEntries,
        total: referencedEntries.length,
        limit: referencedEntries.length,
        skip: 0,
        sys: { type: 'Array' },
      });

    mockCma.contentType.getMany.mockResolvedValueOnce({
      items: contentTypes,
    });

    const result = await fetchRedirects(mockSdk);
    const redirectedEntry = result.redirects[0];

    expect(redirectedEntry.fields.redirectFromContentTypes.slug).toBe('from-entry-slug-field');
    expect(redirectedEntry.fields.redirectToContentTypes.slug).toBe('to-entry-slug-field');
  });
});
