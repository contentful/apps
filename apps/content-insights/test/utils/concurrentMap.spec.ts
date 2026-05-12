import { describe, expect, it, vi } from 'vitest';
import { concurrentMap } from '../../src/utils/concurrentMap';

describe('concurrentMap', () => {
  it('returns results in input order', async () => {
    const result = await concurrentMap([1, 2, 3, 4], 2, async (n) => n * 10);
    expect(result).toEqual([10, 20, 30, 40]);
  });

  it('respects the concurrency cap', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const work = async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
    };
    await concurrentMap([1, 2, 3, 4, 5, 6, 7, 8], 3, work);
    expect(maxInFlight).toBe(3);
  });

  it('handles empty input', async () => {
    const fn = vi.fn();
    const result = await concurrentMap<number, number>([], 3, fn);
    expect(result).toEqual([]);
    expect(fn).not.toHaveBeenCalled();
  });

  it('rejects when any worker throws', async () => {
    const fn = async (n: number) => {
      if (n === 2) throw new Error('boom');
      return n;
    };
    await expect(concurrentMap([1, 2, 3], 2, fn)).rejects.toThrow('boom');
  });
});
