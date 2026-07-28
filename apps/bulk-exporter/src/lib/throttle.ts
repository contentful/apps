export interface ThrottleOptions {
  requestsPerSecond?: number;
  maxConcurrent?: number;
  maxRetries?: number;
}

interface ThrottledRequest<T = unknown> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
  retries: number;
}

export class Throttler {
  private requestsPerSecond: number;
  private maxConcurrent: number;
  private maxRetries: number;
  private tokens: number;
  private lastRefill: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private queue: ThrottledRequest<any>[] = [];
  private activeRequests = 0;
  private processing = false;

  constructor(options: ThrottleOptions = {}) {
    this.requestsPerSecond = options.requestsPerSecond ?? 6;
    this.maxConcurrent = options.maxConcurrent ?? 4;
    this.maxRetries = options.maxRetries ?? 3;
    this.tokens = this.requestsPerSecond;
    this.lastRefill = Date.now();
  }

  private refillTokens(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.requestsPerSecond;

    if (tokensToAdd >= 1) {
      this.tokens = Math.min(this.requestsPerSecond, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      this.refillTokens();

      if (this.tokens < 1 || this.activeRequests >= this.maxConcurrent) {
        await this.sleep(100);
        continue;
      }

      const request = this.queue.shift();
      if (!request) continue;

      this.tokens -= 1;
      this.activeRequests += 1;

      this.executeRequest(request).finally(() => {
        this.activeRequests -= 1;
      });
    }

    this.processing = false;
  }

  private async executeRequest<T>(request: ThrottledRequest<T>): Promise<void> {
    try {
      const result = await request.fn();
      request.resolve(result);
    } catch (error) {
      const is429 = this.is429Error(error);

      if (is429 && request.retries < this.maxRetries) {
        const resetSeconds = this.extractRateLimitReset(error);
        const backoffMs = resetSeconds ? resetSeconds * 1000 : Math.pow(2, request.retries) * 1000;

        await this.sleep(backoffMs);

        request.retries += 1;
        this.queue.unshift(request);

        if (!this.processing) {
          this.processQueue();
        }
      } else {
        request.reject(error);
      }
    }
  }

  private is429Error(error: unknown): boolean {
    if (typeof error === 'object' && error !== null) {
      const err = error as { status?: number; response?: { status?: number } };
      return err.status === 429 || err.response?.status === 429;
    }
    return false;
  }

  private extractRateLimitReset(error: unknown): number | null {
    if (typeof error === 'object' && error !== null) {
      const err = error as {
        headers?: { 'x-contentful-ratelimit-reset'?: string };
        response?: { headers?: { 'x-contentful-ratelimit-reset'?: string } };
      };

      const resetHeader =
        err.headers?.['x-contentful-ratelimit-reset'] ||
        err.response?.headers?.['x-contentful-ratelimit-reset'];

      if (resetHeader) {
        const seconds = parseInt(resetHeader, 10);
        if (!isNaN(seconds)) {
          return seconds;
        }
      }
    }
    return null;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn,
        resolve,
        reject,
        retries: 0,
      });

      this.processQueue();
    });
  }
}

export function createThrottler(options?: ThrottleOptions): Throttler {
  return new Throttler(options);
}
