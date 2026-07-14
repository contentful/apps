import type { CMAClient } from '@contentful/app-sdk';

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
const MAX_SKIP = 9000;

export async function* paginateEntries(
  cma: CMAClient,
  options: PaginateOptions,
  throttledFetch: <T>(fn: () => Promise<T>) => Promise<T>
): AsyncGenerator<unknown[], void, unknown> {
  const { contentType, filters = {}, order = 'sys.createdAt' } = options;

  let skip = 0;
  let total = Infinity;

  const queryParams: Record<string, unknown> = {
    limit: PAGE_SIZE,
    skip,
    order,
    ...filters,
  };

  if (contentType) {
    queryParams.content_type = contentType;
  }

  while (skip < total && skip < MAX_SKIP) {
    queryParams.skip = skip;

    const result = (await throttledFetch(() =>
      cma.entry.getMany({ query: queryParams })
    )) as PaginateResult;

    if (result.items.length === 0) {
      break;
    }

    total = result.total;
    yield result.items;

    skip += PAGE_SIZE;

    if (skip >= total) {
      return;
    }
  }

  if (skip >= MAX_SKIP && skip < total) {
    yield* paginateByCursor(cma, options, throttledFetch, skip);
  }
}

async function* paginateByCursor(
  cma: CMAClient,
  options: PaginateOptions,
  throttledFetch: <T>(fn: () => Promise<T>) => Promise<T>,
  fetchedSoFar: number
): AsyncGenerator<unknown[], void, unknown> {
  const { contentType, filters = {}, order = 'sys.createdAt' } = options;

  const queryParams: Record<string, unknown> = {
    limit: PAGE_SIZE,
    skip: MAX_SKIP,
    order,
    ...filters,
  };

  if (contentType) {
    queryParams.content_type = contentType;
  }

  const firstCursorResult = (await throttledFetch(() =>
    cma.entry.getMany({ query: queryParams })
  )) as PaginateResult;

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
      limit: PAGE_SIZE,
      order,
      'sys.createdAt[gt]': lastItem.sys.createdAt,
      ...filters,
    };

    if (contentType) {
      cursorQueryParams.content_type = contentType;
    }

    const result = (await throttledFetch(() =>
      cma.entry.getMany({ query: cursorQueryParams })
    )) as PaginateResult;

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
