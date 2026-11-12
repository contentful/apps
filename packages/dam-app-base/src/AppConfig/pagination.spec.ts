import { fetchAllPages } from './pagination';

const range = (start: number, count: number) => Array.from({ length: count }, (_, i) => start + i);

describe('fetchAllPages', () => {
  it('returns a single short page without a second request', async () => {
    const fetchPage = jest.fn().mockResolvedValue({ items: [1, 2, 3], total: 3 });

    await expect(fetchAllPages(fetchPage, 100)).resolves.toEqual([1, 2, 3]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith({ limit: 100, skip: 0 });
  });

  it('keeps requesting until every item is collected', async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValueOnce({ items: range(0, 100), total: 250 })
      .mockResolvedValueOnce({ items: range(100, 100), total: 250 })
      .mockResolvedValueOnce({ items: range(200, 50), total: 250 });

    const result = await fetchAllPages(fetchPage, 100);

    expect(result).toEqual(range(0, 250));
    expect(fetchPage.mock.calls.map(([q]) => q)).toEqual([
      { limit: 100, skip: 0 },
      { limit: 100, skip: 100 },
      { limit: 100, skip: 200 },
    ]);
  });

  it('makes one more request when the last page is exactly full', async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValueOnce({ items: range(0, 100), total: 100 })
      .mockResolvedValueOnce({ items: [], total: 100 });

    await expect(fetchAllPages(fetchPage, 100)).resolves.toHaveLength(100);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it('does not depend on total being present', async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValueOnce({ items: range(0, 100) })
      .mockResolvedValueOnce({ items: range(100, 20) });

    await expect(fetchAllPages(fetchPage, 100)).resolves.toHaveLength(120);
  });

  it('returns an empty array for an empty collection', async () => {
    const fetchPage = jest.fn().mockResolvedValue({ items: [], total: 0 });

    await expect(fetchAllPages(fetchPage)).resolves.toEqual([]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('propagates request errors', async () => {
    const fetchPage = jest.fn().mockRejectedValue(new Error('boom'));

    await expect(fetchAllPages(fetchPage)).rejects.toThrow('boom');
  });
});
