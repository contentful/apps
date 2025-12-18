import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PageAppSDK } from '@contentful/app-sdk';
import { EntryProps } from 'contentful-management';
import { fetchAllEntries } from '../../src/utils/entryFetcher';
import { mockCma, getManyEntries } from '../mocks/mockCma';

describe('fetchAllEntries', () => {
  let mockSdk: PageAppSDK;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk = {
      ids: {
        space: 'test-space',
        environment: 'test-environment',
      },
      cma: mockCma,
    } as any;
  });

  it('returns all entries when response fits in single batch', async () => {
    const mockEntries: EntryProps[] = [
      {
        sys: { id: 'entry-1', type: 'Entry' } as any,
        fields: { title: { 'en-US': 'Entry 1' } },
      },
      {
        sys: { id: 'entry-2', type: 'Entry' } as any,
        fields: { title: { 'en-US': 'Entry 2' } },
      },
    ];

    mockCma.entry.getMany.mockResolvedValueOnce(getManyEntries(mockEntries, 2));

    const result = await fetchAllEntries(mockSdk);

    expect(result.entries).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.fetchedAt).toBeInstanceOf(Date);
    expect(mockCma.entry.getMany).toHaveBeenCalledTimes(1);
    expect(mockCma.entry.getMany).toHaveBeenCalledWith({
      spaceId: 'test-space',
      environmentId: 'test-environment',
      query: {
        skip: 0,
        limit: 1000,
      },
    });
  });

  it('handles pagination correctly with multiple batches', async () => {
    const batch1: EntryProps[] = Array.from({ length: 1000 }, (_, i) => ({
      sys: { id: `entry-${i}`, type: 'Entry' } as any,
      fields: { title: { 'en-US': `Entry ${i}` } },
    }));

    const batch2: EntryProps[] = Array.from({ length: 500 }, (_, i) => ({
      sys: { id: `entry-${i + 1000}`, type: 'Entry' } as any,
      fields: { title: { 'en-US': `Entry ${i + 1000}` } },
    }));

    mockCma.entry.getMany
      .mockResolvedValueOnce(getManyEntries(batch1, 1500))
      .mockResolvedValueOnce(getManyEntries(batch2, 1500));

    const result = await fetchAllEntries(mockSdk);

    expect(result.entries).toHaveLength(1500);
    expect(result.total).toBe(1500);
    expect(mockCma.entry.getMany).toHaveBeenCalledTimes(2);
    expect(mockCma.entry.getMany).toHaveBeenNthCalledWith(1, {
      spaceId: 'test-space',
      environmentId: 'test-environment',
      query: {
        skip: 0,
        limit: 1000,
      },
    });
    expect(mockCma.entry.getMany).toHaveBeenNthCalledWith(2, {
      spaceId: 'test-space',
      environmentId: 'test-environment',
      query: {
        skip: 1000,
        limit: 1000,
      },
    });
  });

  it('returns empty entries array when no entries exist', async () => {
    mockCma.entry.getMany.mockResolvedValueOnce(getManyEntries([], 0));

    const result = await fetchAllEntries(mockSdk);

    expect(result.entries).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.fetchedAt).toBeInstanceOf(Date);
    expect(mockCma.entry.getMany).toHaveBeenCalledTimes(1);
  });

  it('throws error for non-size-limit errors', async () => {
    const testError = new Error('Network error');
    mockCma.entry.getMany.mockRejectedValueOnce(testError);

    await expect(fetchAllEntries(mockSdk)).rejects.toThrow('Network error');
    expect(mockCma.entry.getMany).toHaveBeenCalledTimes(1);
  });

  it('reduces batch size and retries when hitting response size limit', async () => {
    const smallerBatch: EntryProps[] = Array.from({ length: 500 }, (_, i) => ({
      sys: { id: `entry-${i}`, type: 'Entry' } as any,
      fields: { title: { 'en-US': `Entry ${i}` } },
    }));

    // First call fails with size limit error
    const sizeLimitError = new Error('Response size too big');
    mockCma.entry.getMany
      .mockRejectedValueOnce(sizeLimitError) // default batch size is 1000
      .mockResolvedValueOnce(getManyEntries(smallerBatch, 500));

    const result = await fetchAllEntries(mockSdk);

    expect(result.entries).toHaveLength(500);
    expect(result.total).toBe(500);
    // Should be called twice: once with 1000 (fails), once with 500 (succeeds)
    expect(mockCma.entry.getMany).toHaveBeenCalledTimes(2);
    expect(mockCma.entry.getMany).toHaveBeenNthCalledWith(1, {
      spaceId: 'test-space',
      environmentId: 'test-environment',
      query: {
        skip: 0,
        limit: 1000,
      },
    });
    expect(mockCma.entry.getMany).toHaveBeenNthCalledWith(2, {
      spaceId: 'test-space',
      environmentId: 'test-environment',
      query: {
        skip: 0,
        limit: 500, // Reduced batch size
      },
    });
  });

  it('throws error when even minimum batch size is too large', async () => {
    const sizeLimitError = new Error('Response size too big');

    // Mock to fail at 1000, then 500, then 250, then 125, then 100 (minimum) - all fail
    mockCma.entry.getMany
      .mockRejectedValueOnce(sizeLimitError) // 1000 fails
      .mockRejectedValueOnce(sizeLimitError) // 500 fails
      .mockRejectedValueOnce(sizeLimitError) // 250 fails
      .mockRejectedValueOnce(sizeLimitError) // 125 fails
      .mockRejectedValueOnce(sizeLimitError) // 62 fails
      .mockRejectedValueOnce(sizeLimitError) // 31 fails
      .mockRejectedValueOnce(sizeLimitError); // 15 (minimum) fails, throws error

    await expect(fetchAllEntries(mockSdk)).rejects.toThrow(
      'Unable to fetch entries: response size too large even with minimal batch size'
    );

    // Should try: 1000 -> 500 -> 250 -> 125 -> 100 (minimum, fails and throws)
    expect(mockCma.entry.getMany).toHaveBeenCalledTimes(7);
  });

  it('handles partial batch correctly', async () => {
    const batch1: EntryProps[] = Array.from({ length: 1000 }, (_, i) => ({
      sys: { id: `entry-${i}`, type: 'Entry' } as any,
      fields: { title: { 'en-US': `Entry ${i}` } },
    }));

    const batch2: EntryProps[] = Array.from({ length: 300 }, (_, i) => ({
      sys: { id: `entry-${i + 1000}`, type: 'Entry' } as any,
      fields: { title: { 'en-US': `Entry ${i + 1000}` } },
    }));

    mockCma.entry.getMany
      .mockResolvedValueOnce(getManyEntries(batch1, 1300))
      .mockResolvedValueOnce(getManyEntries(batch2, 1300));

    const result = await fetchAllEntries(mockSdk);

    expect(result.entries).toHaveLength(1300);
    expect(result.total).toBe(1300);
    expect(mockCma.entry.getMany).toHaveBeenCalledTimes(2);
  });
});
