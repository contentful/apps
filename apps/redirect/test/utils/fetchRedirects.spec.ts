import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fetchRedirects, FetchRedirectsResult } from '../../src/utils/fetchRedirects';
import { REDIRECT_CONTENT_TYPE_ID } from '../../src/utils/consts';
import { EntryProps } from 'contentful-management';
import { mockCma, mockSdk } from '../mocks';
import { createMockEntry } from './testUtils';

describe('fetchRedirects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    const items: EntryProps[] = [createMockEntry('entry-1'), createMockEntry('entry-2')];
    mockCma.entry.getMany.mockResolvedValueOnce({
      items,
      total: 2,
      limit: 100,
      skip: 0,
      sys: { type: 'Array' },
    });

    (mockCma.entry.get as any).mockResolvedValue({
      fields: {
        title: { 'en-US': 'Resolved title' },
      },
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
});
