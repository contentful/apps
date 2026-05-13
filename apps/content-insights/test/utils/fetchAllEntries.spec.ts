import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PageAppSDK } from '@contentful/app-sdk';
import { EntryProps } from 'contentful-management';
import { fetchAllEntries } from '../../src/utils/fetchAllEntries';
import { mockCma, cursorPage } from '../mocks/mockCma';

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
    mockSdk = {
      ids: { space: 'test-space', environment: 'test-environment' },
      cma: mockCma,
    } as any;
  });

  it('returns no entries when there are no content types', async () => {
    const result = await fetchAllEntries(mockSdk, []);
    expect(result.entries).toEqual([]);
    expect(result.total).toBe(0);
    expect(mockCma.entry.getManyWithCursor).not.toHaveBeenCalled();
  });

  it('runs one cursor stream per content type', async () => {
    mockCma.entry.getManyWithCursor
      .mockResolvedValueOnce(cursorPage([sysOnly('a1', 'blog')]))
      .mockResolvedValueOnce(cursorPage([sysOnly('b1', 'page')]));

    const result = await fetchAllEntries(mockSdk, ['blog', 'page']);

    expect(result.entries.map((e) => e.sys.id).sort()).toEqual(['a1', 'b1']);
    expect(result.total).toBe(2);

    const calls = mockCma.entry.getManyWithCursor.mock.calls.map((c: any[]) => c[0]);
    expect(calls).toContainEqual({
      query: { content_type: 'blog', limit: 1000 },
    });
    expect(calls).toContainEqual({
      query: { content_type: 'page', limit: 1000 },
    });
  });

  it('paginates a single content type via pages.next', async () => {
    mockCma.entry.getManyWithCursor
      .mockResolvedValueOnce(cursorPage([sysOnly('a1', 'blog')], 'cur1'))
      .mockResolvedValueOnce(cursorPage([sysOnly('a2', 'blog')]));

    const result = await fetchAllEntries(mockSdk, ['blog']);

    expect(result.entries.map((e) => e.sys.id)).toEqual(['a1', 'a2']);
    expect(mockCma.entry.getManyWithCursor).toHaveBeenNthCalledWith(2, {
      query: { content_type: 'blog', limit: 1000, pageNext: 'cur1' },
    });
  });

  it('propagates errors from any stream', async () => {
    mockCma.entry.getManyWithCursor.mockRejectedValueOnce(new Error('Network error'));
    await expect(fetchAllEntries(mockSdk, ['blog'])).rejects.toThrow('Network error');
  });
});
