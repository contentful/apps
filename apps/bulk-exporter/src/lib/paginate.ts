import type { CMAClient } from '@contentful/app-sdk';
import { isResponseTooBigError } from './cmaError';

export interface PaginateOptions {
  contentType?: string;
  limit?: number;
  order?: string;
  filters?: Record<string, unknown>;
}

export interface PaginateResult {
  items: unknown[];
  total: number;
}

const PAGE_SIZE = 1000;
const MIN_PAGE_SIZE = 1;
const MAX_SKIP = 9000;

/**
 * Fetches a page, halving `limit` and retrying if the CMA rejects it as too
 * large. Returns the limit that actually worked so the caller can carry it
 * forward as the starting point for the next page instead of re-discovering it
 * on every request.
 *
 * Halves all the way to a single entry: any floor above 1 turns an export of
 * sufficiently large entries into an unrecoverable failure, and only a
 * single-entry page that is still too big is genuinely beyond our reach.
 */
async function fetchPageWithAdaptiveLimit(
  cma: CMAClient,
  queryParams: Record<string, unknown>,
  startingLimit: number,
  throttledFetch: <T>(fn: () => Promise<T>) => Promise<T>
): Promise<{ result: PaginateResult; limitUsed: number }> {
  let limit = startingLimit;

  while (true) {
    try {
      const result = (await throttledFetch(() =>
        cma.entry.getMany({ query: { ...queryParams, limit } })
      )) as PaginateResult;
      return { result, limitUsed: limit };
    } catch (error) {
      if (!isResponseTooBigError(error) || limit <= MIN_PAGE_SIZE) {
        throw error;
      }
      limit = Math.max(MIN_PAGE_SIZE, Math.floor(limit / 2));
    }
  }
}

export async function* paginateEntries(
  cma: CMAClient,
  options: PaginateOptions,
  throttledFetch: <T>(fn: () => Promise<T>) => Promise<T>
): AsyncGenerator<unknown[], void, unknown> {
  const { contentType, filters = {}, order = 'sys.createdAt' } = options;

  let skip = 0;
  let total = Infinity;
  let limit = PAGE_SIZE;

  const queryParams: Record<string, unknown> = {
    order,
    ...filters,
  };

  if (contentType) {
    queryParams.content_type = contentType;
  }

  while (skip < total && skip < MAX_SKIP) {
    queryParams.skip = skip;

    const { result, limitUsed } = await fetchPageWithAdaptiveLimit(
      cma,
      queryParams,
      limit,
      throttledFetch
    );
    limit = limitUsed;

    if (result.items.length === 0) {
      break;
    }

    total = result.total;
    yield result.items;

    skip += result.items.length;

    if (skip >= total) {
      return;
    }
  }

  if (skip >= MAX_SKIP && skip < total) {
    yield* paginateByCursor(cma, options, throttledFetch, skip, limit);
  }
}

async function* paginateByCursor(
  cma: CMAClient,
  options: PaginateOptions,
  throttledFetch: <T>(fn: () => Promise<T>) => Promise<T>,
  fetchedSoFar: number,
  startingLimit: number
): AsyncGenerator<unknown[], void, unknown> {
  const { contentType, filters = {}, order = 'sys.createdAt' } = options;
  let limit = startingLimit;

  const queryParams: Record<string, unknown> = {
    skip: MAX_SKIP,
    order,
    ...filters,
  };

  if (contentType) {
    queryParams.content_type = contentType;
  }

  const { result: firstCursorResult, limitUsed } = await fetchPageWithAdaptiveLimit(
    cma,
    queryParams,
    limit,
    throttledFetch
  );
  limit = limitUsed;

  if (firstCursorResult.items.length === 0) {
    return;
  }

  yield firstCursorResult.items;

  let lastItem = firstCursorResult.items[firstCursorResult.items.length - 1] as {
    sys: { createdAt: string };
  };
  let fetched = fetchedSoFar + firstCursorResult.items.length;
  const total = firstCursorResult.total;

  while (fetched < total) {
    const cursorQueryParams: Record<string, unknown> = {
      order,
      'sys.createdAt[gt]': lastItem.sys.createdAt,
      ...filters,
    };

    if (contentType) {
      cursorQueryParams.content_type = contentType;
    }

    const { result, limitUsed: nextLimitUsed } = await fetchPageWithAdaptiveLimit(
      cma,
      cursorQueryParams,
      limit,
      throttledFetch
    );
    limit = nextLimitUsed;

    if (result.items.length === 0) {
      break;
    }

    yield result.items;

    lastItem = result.items[result.items.length - 1] as {
      sys: { createdAt: string };
    };
    fetched += result.items.length;
  }
}

export async function getEntryCount(
  cma: CMAClient,
  contentType: string | undefined,
  filters: Record<string, unknown> = {}
): Promise<number> {
  const queryParams: Record<string, unknown> = {
    limit: 0,
    ...filters,
  };

  if (contentType) {
    queryParams.content_type = contentType;
  }

  const result = (await cma.entry.getMany({
    query: queryParams,
  })) as PaginateResult;

  return result.total;
}
