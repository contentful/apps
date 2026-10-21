import { describe, it, expect, vi } from 'vitest';
import {
  paginateEntries,
  getEntryCount,
  scanMatchingEntries,
  choosePagingMode,
  sliceMatchingPage,
  orderEntriesByIds,
} from '../paginate';

describe('paginate', () => {
  describe('paginateEntries', () => {
    it('should paginate through all entries with skip', async () => {
      const mockCma = {
        entry: {
          getMany: vi
            .fn()
            .mockResolvedValueOnce({
              items: Array(1000).fill({ sys: { id: '1' } }),
              total: 2500,
            })
            .mockResolvedValueOnce({
              items: Array(1000).fill({ sys: { id: '2' } }),
              total: 2500,
            })
            .mockResolvedValueOnce({
              items: Array(500).fill({ sys: { id: '3' } }),
              total: 2500,
            }),
        },
      };

      const throttledFetch = vi.fn((fn) => fn());

      const batches = [];
      for await (const batch of paginateEntries(
        mockCma as any,
        { contentType: 'test' },
        throttledFetch
      )) {
        batches.push(batch);
      }

      expect(batches).toHaveLength(3);
      expect(batches[0]).toHaveLength(1000);
      expect(batches[1]).toHaveLength(1000);
      expect(batches[2]).toHaveLength(500);
      expect(mockCma.entry.getMany).toHaveBeenCalledTimes(3);
    });

    it('should switch to cursor pagination after skip 9000', async () => {
      const mockCma = {
        entry: {
          getMany: vi.fn().mockImplementation(({ query }) => {
            if (query.skip !== undefined && query.skip < 9000) {
              return Promise.resolve({
                items: Array(1000).fill({ sys: { id: 'skip', createdAt: '2024-01-01' } }),
                total: 12000,
              });
            }
            if (query.skip === 9000) {
              return Promise.resolve({
                items: Array(1000).fill({ sys: { id: 'cursor1', createdAt: '2024-01-10' } }),
                total: 12000,
              });
            }
            if (query['sys.createdAt[gt]']) {
              return Promise.resolve({
                items: Array(1000).fill({ sys: { id: 'cursor2', createdAt: '2024-01-20' } }),
                total: 12000,
              });
            }
            return Promise.resolve({ items: [], total: 12000 });
          }),
        },
      };

      const throttledFetch = vi.fn((fn) => fn());

      const batches = [];
      for await (const batch of paginateEntries(
        mockCma as any,
        { contentType: 'test' },
        throttledFetch
      )) {
        batches.push(batch);
        if (batches.length >= 11) break;
      }

      expect(batches.length).toBeGreaterThanOrEqual(10);

      const calls = mockCma.entry.getMany.mock.calls;
      const cursorCalls = calls.filter((call) => call[0].query['sys.createdAt[gt]']);
      expect(cursorCalls.length).toBeGreaterThan(0);
    });

    it('should stop when no more items', async () => {
      const mockCma = {
        entry: {
          getMany: vi.fn().mockResolvedValueOnce({
            items: Array(500).fill({ sys: { id: '1' } }),
            total: 500,
          }),
        },
      };

      const throttledFetch = vi.fn((fn) => fn());

      const batches = [];
      for await (const batch of paginateEntries(
        mockCma as any,
        { contentType: 'test' },
        throttledFetch
      )) {
        batches.push(batch);
      }

      expect(batches).toHaveLength(1);
      expect(batches[0]).toHaveLength(500);
    });
  });

  describe('paginateEntries response-size handling', () => {
    // What the app actually catches in production. The web app relays the
    // rejection into the app's iframe over postMessage, which reduces the
    // error to `{ code, message, data }` -- no prototype, no `sys`, no
    // `status` -- and puts contentful-sdk-core's JSON blob in `message`.
    const responseTooBigError = {
      code: 'BadRequest',
      message: JSON.stringify(
        {
          status: 400,
          statusText: 'Bad Request',
          message: 'Response size too big. Maximum allowed response size: 7340032B.',
          details: {},
          request: { url: '/spaces/60i3uyhfow4o/environments/master/entries', method: 'get' },
          requestId: '9a90d083-9da4-46c0-adcf-cad04aea653a',
        },
        null,
        '  '
      ),
      data: undefined,
    };

    it('halves the page size and retries when the CMA rejects a page as too big', async () => {
      const getMany = vi
        .fn()
        .mockRejectedValueOnce(responseTooBigError)
        .mockRejectedValueOnce(responseTooBigError)
        .mockResolvedValueOnce({
          items: Array(250).fill({ sys: { id: 'small' } }),
          total: 250,
        });

      const mockCma = { entry: { getMany } };
      const throttledFetch = vi.fn((fn) => fn());

      const batches = [];
      for await (const batch of paginateEntries(
        mockCma as any,
        { contentType: 'statement' },
        throttledFetch
      )) {
        batches.push(batch);
      }

      expect(batches).toHaveLength(1);
      expect(batches[0]).toHaveLength(250);
      expect(getMany).toHaveBeenCalledTimes(3);
      expect(getMany.mock.calls[0][0].query.limit).toBe(1000);
      expect(getMany.mock.calls[1][0].query.limit).toBe(500);
      expect(getMany.mock.calls[2][0].query.limit).toBe(250);
    });

    it('carries the reduced page size forward into subsequent pages', async () => {
      const getMany = vi
        .fn()
        .mockRejectedValueOnce(responseTooBigError)
        .mockResolvedValueOnce({
          items: Array(500).fill({ sys: { id: 'page1' } }),
          total: 700,
        })
        .mockResolvedValueOnce({
          items: Array(200).fill({ sys: { id: 'page2' } }),
          total: 700,
        });

      const mockCma = { entry: { getMany } };
      const throttledFetch = vi.fn((fn) => fn());

      const batches = [];
      for await (const batch of paginateEntries(
        mockCma as any,
        { contentType: 'statement' },
        throttledFetch
      )) {
        batches.push(batch);
      }

      expect(batches).toHaveLength(2);
      expect(getMany.mock.calls[1][0].query.limit).toBe(500);
      // Second page starts at the previously-successful 500 rather than
      // re-discovering it by failing at 1000 again.
      expect(getMany.mock.calls[2][0].query.limit).toBe(500);
      expect(getMany.mock.calls[2][0].query.skip).toBe(500);
    });

    it('halves down to a single entry before giving up', async () => {
      const getMany = vi.fn().mockRejectedValue(responseTooBigError);
      const mockCma = { entry: { getMany } };
      const throttledFetch = vi.fn((fn) => fn());

      const run = async () => {
        for await (const _batch of paginateEntries(
          mockCma as any,
          { contentType: 'statement' },
          throttledFetch
        )) {
          // drain
        }
      };

      await expect(run()).rejects.toBe(responseTooBigError);

      const limitsTried = getMany.mock.calls.map((call) => call[0].query.limit);
      expect(limitsTried).toEqual([1000, 500, 250, 125, 62, 31, 15, 7, 3, 1]);
    });

    it('recovers when only a very small page fits under the response cap', async () => {
      const getMany = vi
        .fn()
        .mockImplementation(({ query }) =>
          query.limit > 25
            ? Promise.reject(responseTooBigError)
            : Promise.resolve({ items: Array(query.limit).fill({ sys: { id: 'big' } }), total: 15 })
        );
      const mockCma = { entry: { getMany } };
      const throttledFetch = vi.fn((fn) => fn());

      const batches = [];
      for await (const batch of paginateEntries(
        mockCma as any,
        { contentType: 'statement' },
        throttledFetch
      )) {
        batches.push(batch);
      }

      expect(batches.flat()).toHaveLength(15);
    });

    it('retries the raw API error body shape', async () => {
      const rawApiError = {
        sys: { type: 'Error', id: 'BadRequest' },
        message: 'Response size too big. Maximum allowed response size: 7340032B.',
        requestId: '9a90d083-9da4-46c0-adcf-cad04aea653a',
      };
      const getMany = vi
        .fn()
        .mockRejectedValueOnce(rawApiError)
        .mockResolvedValueOnce({ items: [{ sys: { id: 'ok' } }], total: 1 });
      const mockCma = { entry: { getMany } };

      const batches = [];
      for await (const batch of paginateEntries(
        mockCma as any,
        { contentType: 'statement' },
        vi.fn((fn) => fn())
      )) {
        batches.push(batch);
      }

      expect(batches.flat()).toHaveLength(1);
      expect(getMany.mock.calls[1][0].query.limit).toBe(500);
    });

    it('rethrows unrelated errors without retrying', async () => {
      const otherError = { sys: { type: 'Error', id: 'AccessDenied' }, message: 'Nope' };
      const getMany = vi.fn().mockRejectedValue(otherError);
      const mockCma = { entry: { getMany } };
      const throttledFetch = vi.fn((fn) => fn());

      const run = async () => {
        for await (const _batch of paginateEntries(
          mockCma as any,
          { contentType: 'statement' },
          throttledFetch
        )) {
          // drain
        }
      };

      await expect(run()).rejects.toBe(otherError);
      expect(getMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('scanMatchingEntries', () => {
    const isPublished = (entry: { sys: { version?: number; publishedVersion?: number } }) =>
      entry.sys.publishedVersion !== undefined &&
      entry.sys.version === entry.sys.publishedVersion + 1;

    // Entries alternate published (version 2, publishedVersion 1) and changed (version 5).
    const makeEntries = (count: number, offset: number) =>
      Array.from({ length: count }, (_, i) => {
        const n = offset + i;
        return {
          sys: { id: `e${n}`, version: n % 2 === 0 ? 2 : 5, publishedVersion: 1 },
        };
      });

    it('returns only post-filter passes and exact true when the scan finishes', async () => {
      const getMany = vi.fn().mockImplementation(({ query }) => {
        if (query.limit === 0) return Promise.resolve({ items: [], total: 10 });
        return Promise.resolve({ items: makeEntries(10, 0), total: 10 });
      });
      const throttledFetch = vi.fn((fn) => fn());

      const result = await scanMatchingEntries(
        { entry: { getMany } } as any,
        { contentType: 'test', filters: { 'sys.archivedAt[exists]': false } },
        isPublished,
        throttledFetch,
        9000
      );

      expect(result.exact).toBe(true);
      expect(result.rawTotal).toBe(10);
      expect(result.matchingIds).toEqual(['e0', 'e2', 'e4', 'e6', 'e8']);

      const scanCall = getMany.mock.calls.find((call) => call[0].query.limit !== 0);
      expect(scanCall?.[0].query.select).toBe(
        'sys.id,sys.version,sys.publishedVersion,sys.archivedAt'
      );
      expect(scanCall?.[0].query['sys.archivedAt[exists]']).toBe(false);
    });

    it('returns exact true with no matches without scanning when the total is zero', async () => {
      const getMany = vi.fn().mockResolvedValue({ items: [], total: 0 });

      const result = await scanMatchingEntries(
        { entry: { getMany } } as any,
        { contentType: 'test' },
        isPublished,
        vi.fn((fn) => fn()),
        9000
      );

      expect(result).toEqual({ matchingIds: [], exact: true, rawTotal: 0 });
      expect(getMany).toHaveBeenCalledTimes(1);
    });

    it('returns exact false and the raw total when the cap is hit before the scan ends', async () => {
      const getMany = vi.fn().mockImplementation(({ query }) => {
        if (query.limit === 0) return Promise.resolve({ items: [], total: 5000 });
        return Promise.resolve({ items: makeEntries(query.limit, query.skip), total: 5000 });
      });

      const result = await scanMatchingEntries(
        { entry: { getMany } } as any,
        { contentType: 'test' },
        isPublished,
        vi.fn((fn) => fn()),
        2000
      );

      expect(result.exact).toBe(false);
      expect(result.rawTotal).toBe(5000);
      // 1 count call + 2 scan pages of 1000, then it stops.
      expect(getMany).toHaveBeenCalledTimes(3);
    });

    it('stays exact when the cap equals the number of entries scanned to the end', async () => {
      const getMany = vi.fn().mockImplementation(({ query }) => {
        if (query.limit === 0) return Promise.resolve({ items: [], total: 1000 });
        return Promise.resolve({ items: makeEntries(1000, 0), total: 1000 });
      });

      const result = await scanMatchingEntries(
        { entry: { getMany } } as any,
        { contentType: 'test' },
        isPublished,
        vi.fn((fn) => fn()),
        1000
      );

      expect(result.exact).toBe(true);
      expect(result.matchingIds).toHaveLength(500);
    });
  });

  describe('choosePagingMode', () => {
    it('uses the matching list when the scan finished', () => {
      expect(choosePagingMode({ matchingIds: ['a'], exact: true, rawTotal: 1 })).toBe(
        'matching-list'
      );
    });

    it('falls back to skip paging when the cap was hit', () => {
      expect(choosePagingMode({ matchingIds: ['a'], exact: false, rawTotal: 20000 })).toBe(
        'skip-paging'
      );
    });
  });

  describe('sliceMatchingPage', () => {
    const ids = Array.from({ length: 120 }, (_, i) => `e${i}`);

    it('returns a full page of ids from the requested page', () => {
      const page = sliceMatchingPage(ids, 1, 50);
      expect(page).toHaveLength(50);
      expect(page[0]).toBe('e50');
      expect(page[49]).toBe('e99');
    });

    it('returns the remainder on the last page', () => {
      expect(sliceMatchingPage(ids, 2, 50)).toEqual(ids.slice(100));
    });

    it('returns nothing past the last page', () => {
      expect(sliceMatchingPage(ids, 3, 50)).toEqual([]);
    });
  });

  describe('orderEntriesByIds', () => {
    it('reorders a fetched batch into the id order', () => {
      const fetched = [{ sys: { id: 'b' } }, { sys: { id: 'c' } }, { sys: { id: 'a' } }];
      expect(orderEntriesByIds(fetched, ['a', 'b', 'c']).map((e) => e.sys.id)).toEqual([
        'a',
        'b',
        'c',
      ]);
    });

    it('drops ids that were not found in the fetched batch', () => {
      const fetched = [{ sys: { id: 'b' } }, { sys: { id: 'a' } }];
      expect(orderEntriesByIds(fetched, ['a', 'missing', 'b']).map((e) => e.sys.id)).toEqual([
        'a',
        'b',
      ]);
    });
  });

  describe('getEntryCount', () => {
    it('should return total count', async () => {
      const mockCma = {
        entry: {
          getMany: vi.fn().mockResolvedValue({
            items: [],
            total: 1234,
          }),
        },
      };

      const count = await getEntryCount(mockCma as any, 'test', {});

      expect(count).toBe(1234);
      expect(mockCma.entry.getMany).toHaveBeenCalledWith({
        query: {
          content_type: 'test',
          limit: 0,
        },
      });
    });

    it('should pass filters to query', async () => {
      const mockCma = {
        entry: {
          getMany: vi.fn().mockResolvedValue({
            items: [],
            total: 100,
          }),
        },
      };

      const filters = {
        'sys.publishedAt[exists]': true,
        'sys.createdAt[gte]': '2024-01-01',
      };

      await getEntryCount(mockCma as any, 'test', filters);

      expect(mockCma.entry.getMany).toHaveBeenCalledWith({
        query: {
          content_type: 'test',
          limit: 0,
          ...filters,
        },
      });
    });
  });
});
