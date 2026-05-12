import { describe, expect, it, vi, beforeEach } from 'vitest';
import { cursorPaginate, CursorFetcher } from '../../src/utils/cursorPaginate';

describe('cursorPaginate', () => {
  let fetcher: ReturnType<typeof vi.fn> & CursorFetcher<unknown, Record<string, unknown>>;

  beforeEach(() => {
    fetcher = vi.fn() as ReturnType<typeof vi.fn> & CursorFetcher<unknown, Record<string, unknown>>;
  });

  it('returns all items from a single page', async () => {
    fetcher.mockResolvedValueOnce({ items: [{ id: '1' }, { id: '2' }] });
    const result = await cursorPaginate(fetcher, { extra: 'flag' });
    expect(result).toEqual([{ id: '1' }, { id: '2' }]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith({ extra: 'flag', limit: 1000 });
  });

  it('follows pages.next until empty', async () => {
    fetcher
      .mockResolvedValueOnce({ items: [{ id: '1' }], pages: { next: 'cur1' } })
      .mockResolvedValueOnce({ items: [{ id: '2' }], pages: { next: 'cur2' } })
      .mockResolvedValueOnce({ items: [{ id: '3' }] });
    const result = await cursorPaginate(fetcher, {});
    expect(result.map((e) => (e as any).id)).toEqual(['1', '2', '3']);
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(fetcher).toHaveBeenNthCalledWith(2, { limit: 1000, pageNext: 'cur1' });
    expect(fetcher).toHaveBeenNthCalledWith(3, { limit: 1000, pageNext: 'cur2' });
  });

  it('halves batch size on Response size too big', async () => {
    fetcher
      .mockRejectedValueOnce(new Error('Response size too big'))
      .mockResolvedValueOnce({ items: [{ id: '1' }] });
    const result = await cursorPaginate(fetcher, {});
    expect(result).toHaveLength(1);
    expect(fetcher).toHaveBeenNthCalledWith(1, { limit: 1000 });
    expect(fetcher).toHaveBeenNthCalledWith(2, { limit: 500 });
  });

  it('throws once batch shrinks below MIN_BATCH_SIZE', async () => {
    fetcher.mockRejectedValue(new Error('Response size too big'));
    await expect(cursorPaginate(fetcher, {})).rejects.toThrow(
      'response size too large even with minimal batch size'
    );
  });

  it('rethrows non-size errors', async () => {
    fetcher.mockRejectedValueOnce(new Error('Network error'));
    await expect(cursorPaginate(fetcher, {})).rejects.toThrow('Network error');
  });
});
