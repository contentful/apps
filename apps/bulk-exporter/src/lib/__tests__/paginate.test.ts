import { describe, it, expect, vi } from 'vitest';
import { paginateEntries, getEntryCount } from '../paginate';

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
