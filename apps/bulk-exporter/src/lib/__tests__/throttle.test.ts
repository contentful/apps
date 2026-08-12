import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Throttler } from '../throttle';

describe('Throttler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should execute requests within rate limit', async () => {
    const throttler = new Throttler({ requestsPerSecond: 2, maxConcurrent: 1 });
    const fn = vi.fn().mockResolvedValue('success');

    const promise1 = throttler.execute(fn);
    const promise2 = throttler.execute(fn);

    await vi.advanceTimersByTimeAsync(100);
    await Promise.all([promise1, promise2]);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should respect max concurrent requests', async () => {
    const throttler = new Throttler({ requestsPerSecond: 10, maxConcurrent: 2 });
    let activeCount = 0;
    let maxActive = 0;

    const fn = vi.fn(async () => {
      activeCount++;
      maxActive = Math.max(maxActive, activeCount);
      await new Promise((resolve) => setTimeout(resolve, 100));
      activeCount--;
      return 'success';
    });

    const promises = [
      throttler.execute(fn),
      throttler.execute(fn),
      throttler.execute(fn),
      throttler.execute(fn),
    ];

    await vi.advanceTimersByTimeAsync(500);
    await Promise.all(promises);

    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it('should retry on 429 with rate limit reset header', async () => {
    const throttler = new Throttler({ requestsPerSecond: 10, maxRetries: 3 });

    let callCount = 0;
    const fn = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        throw {
          status: 429,
          headers: { 'x-contentful-ratelimit-reset': '1' },
        };
      }
      return 'success';
    });

    const promise = throttler.execute(fn);

    await vi.advanceTimersByTimeAsync(1500);
    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should use exponential backoff when rate limit reset header is missing', async () => {
    const throttler = new Throttler({ requestsPerSecond: 10, maxRetries: 3 });

    let callCount = 0;
    const fn = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        throw { status: 429 };
      }
      return 'success';
    });

    const promise = throttler.execute(fn);

    await vi.advanceTimersByTimeAsync(1500);
    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should fail after max retries', async () => {
    const throttler = new Throttler({ requestsPerSecond: 10, maxRetries: 2 });

    const fn = vi.fn(async () => {
      throw { status: 429 };
    });

    const promise = throttler.execute(fn);
    // suppress unhandled rejection until we await below
    promise.catch(() => {});

    await vi.advanceTimersByTimeAsync(5000);

    try {
      await promise;
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toMatchObject({ status: 429 });
      expect(fn).toHaveBeenCalledTimes(3);
    }
  });

  it('should not retry non-429 errors', async () => {
    const throttler = new Throttler({ requestsPerSecond: 10, maxRetries: 3 });

    const fn = vi.fn(async () => {
      throw new Error('Server error');
    });

    await expect(throttler.execute(fn)).rejects.toThrow('Server error');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
