import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PageAppSDK } from '@contentful/app-sdk';
import { EntryProps } from 'contentful-management';
import { fetchAllEntries } from '../../src/utils/fetchAllEntries';
import { mockCma, getManyEntries } from '../mocks/mockCma';

const sysOnly = (id: string, contentTypeId: string): EntryProps =>
  ({
    sys: {
      id,
      type: 'Entry',
      contentType: { sys: { id: contentTypeId, type: 'Link', linkType: 'ContentType' } },
    },
  } as any);

describe('fetchAllEntries', () => {
  let mockSdk: PageAppSDK;

  beforeEach(() => {
    vi.clearAllMocks();
    // clearAllMocks doesn't reset queued mockResolvedValueOnce implementations,
    // so do it explicitly to keep tests isolated.
    mockCma.entry.getMany.mockReset();
    mockSdk = {
      ids: { space: 'test-space', environment: 'test-environment' },
      cma: mockCma,
    } as any;
  });

  it('returns no entries when there are no content types', async () => {
    const result = await fetchAllEntries(mockSdk, []);
    expect(result.entries).toEqual([]);
    expect(result.total).toBe(0);
    expect(mockCma.entry.getMany).not.toHaveBeenCalled();
  });

  it('runs one stream per content type with content_type filter', async () => {
    mockCma.entry.getMany
      .mockResolvedValueOnce(getManyEntries([sysOnly('a1', 'blog')]))
      .mockResolvedValueOnce(getManyEntries([sysOnly('b1', 'page')]));

    const result = await fetchAllEntries(mockSdk, ['blog', 'page']);

    expect(result.entries.map((e) => e.sys.id).sort()).toEqual(['a1', 'b1']);
    expect(result.total).toBe(2);

    const calls = mockCma.entry.getMany.mock.calls.map((c: any[]) => c[0]);
    expect(calls).toContainEqual({
      query: { content_type: 'blog', skip: 0, limit: 1000 },
    });
    expect(calls).toContainEqual({
      query: { content_type: 'page', skip: 0, limit: 1000 },
    });
  });

  it('keeps paginating while a full page is returned', async () => {
    // First page: items.length === limit (full page) signals "more available".
    // Use mockImplementation to dynamically respond, so we don't need to
    // hand-roll 1000 entries per page.
    let call = 0;
    mockCma.entry.getMany.mockImplementation(async ({ query }: any) => {
      call++;
      if (call === 1) {
        // Pretend a full page of `limit` items came back.
        const items = Array.from({ length: query.limit }, (_, i) => sysOnly(`a${i}`, 'blog'));
        return { items, total: query.limit + 1, skip: 0, limit: query.limit };
      }
      // Second page: 1 item -> short page, loop terminates.
      return getManyEntries([sysOnly('tail', 'blog')], query.limit + 1);
    });

    const result = await fetchAllEntries(mockSdk, ['blog']);

    expect(mockCma.entry.getMany).toHaveBeenCalledTimes(2);
    expect(mockCma.entry.getMany).toHaveBeenNthCalledWith(2, {
      query: { content_type: 'blog', skip: 1000, limit: 1000 },
    });
    expect(result.entries[result.entries.length - 1].sys.id).toBe('tail');
  });

  it('halves the batch size on "Response size too big" and retries the same page', async () => {
    mockCma.entry.getMany
      .mockRejectedValueOnce(new Error('Response size too big'))
      .mockResolvedValueOnce(getManyEntries([sysOnly('a1', 'blog')]));

    const result = await fetchAllEntries(mockSdk, ['blog']);

    expect(result.entries).toHaveLength(1);
    const calls = mockCma.entry.getMany.mock.calls.map((c: any[]) => c[0]);
    expect(calls[0]).toEqual({ query: { content_type: 'blog', skip: 0, limit: 1000 } });
    expect(calls[1]).toEqual({ query: { content_type: 'blog', skip: 0, limit: 500 } });
  });

  it('throws once batch size has shrunk to MIN_BATCH_SIZE', async () => {
    mockCma.entry.getMany.mockRejectedValue(new Error('Response size too big'));

    await expect(fetchAllEntries(mockSdk, ['blog'])).rejects.toThrow(
      'response size too large even with minimal batch size'
    );
  });

  it('propagates non-size errors from any stream', async () => {
    mockCma.entry.getMany.mockRejectedValueOnce(new Error('Network error'));
    await expect(fetchAllEntries(mockSdk, ['blog'])).rejects.toThrow('Network error');
  });
});
