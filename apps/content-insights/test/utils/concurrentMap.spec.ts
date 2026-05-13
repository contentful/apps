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

  it('stops pulling new items after a worker throws', async () => {
    const seen: number[] = [];
    const fn = async (n: number) => {
      seen.push(n);
      // Item 1 throws quickly; all others stall long enough that the abort
      // flag is set before they finish and pull a new item.
      if (n === 1) throw new Error('boom');
      await new Promise((r) => setTimeout(r, 20));
      return n;
    };

    await expect(concurrentMap([1, 2, 3, 4, 5, 6, 7, 8], 2, fn)).rejects.toThrow('boom');

    // Wait past the slow workers so any straggler that ignored the abort
    // would have shown up in `seen` by now.
    await new Promise((r) => setTimeout(r, 50));

    // With concurrency=2, items 1 and 2 start immediately; once 1 throws,
    // runner 1 is gone and runner 2 must not pick up 3..8.
    expect(seen).toEqual([1, 2]);
  });
});
