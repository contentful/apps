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
 * Most entries a search scans to build an exact matching count. Kept at MAX_SKIP so
 * the scan stays inside the plain skip/limit loop and never reaches the cursor path.
 */
export const SCAN_CAP = MAX_SKIP;

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

export interface ScanResult {
  /** sys.id of entries passing the post-filter, in scan order */
  matchingIds: string[];
  /** false if the cap was hit before the scan finished; matchingIds is then incomplete */
  exact: boolean;
  /** The CMA's own unfiltered total, used for the "Approximate" count */
  rawTotal: number;
}

interface ScannedEntry {
  sys: { id: string; version?: number; publishedVersion?: number; archivedAt?: string };
}

const SCAN_SELECT = 'sys.id,sys.version,sys.publishedVersion,sys.archivedAt';

/**
 * Walks the search's entries (ids and status fields only) and collects the ids that
 * pass `postFilter`, so the displayed count can match what the export will contain.
 * Stops once `cap` entries have been scanned without reaching the end, returning
 * `exact: false` and the CMA's raw total instead of an incomplete match list.
 */
export async function scanMatchingEntries(
  cma: CMAClient,
  options: PaginateOptions,
  postFilter: (entry: ScannedEntry) => boolean,
  throttledFetch: <T>(fn: () => Promise<T>) => Promise<T>,
  cap: number
): Promise<ScanResult> {
  const rawTotal = await throttledFetch(() =>
    getEntryCount(cma, options.contentType, options.filters)
  );

  const matchingIds: string[] = [];
  if (rawTotal === 0) {
    return { matchingIds, exact: true, rawTotal };
  }

  const scanOptions: PaginateOptions = {
    ...options,
    filters: { ...options.filters, select: SCAN_SELECT },
  };

  let scanned = 0;
  for await (const batch of paginateEntries(cma, scanOptions, throttledFetch)) {
    for (const entry of batch as ScannedEntry[]) {
      if (postFilter(entry)) {
        matchingIds.push(entry.sys.id);
      }
    }
    scanned += batch.length;

    if (scanned >= cap && scanned < rawTotal) {
      return { matchingIds, exact: false, rawTotal };
    }
  }

  return { matchingIds, exact: true, rawTotal };
}

/**
 * 'matching-list' builds each page from the scan's complete list of matching ids, so
 * every page is full. 'skip-paging' is the plain skip/limit fetch with the post-filter
 * applied afterward, used when the scan hit its cap and the id list is incomplete.
 */
export function choosePagingMode(scan: ScanResult): 'matching-list' | 'skip-paging' {
  return scan.exact ? 'matching-list' : 'skip-paging';
}

export function sliceMatchingPage(
  matchingIds: string[],
  page: number,
  itemsPerPage: number
): string[] {
  return matchingIds.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
}

/**
 * The CMA's `sys.id[in]` filter does not return entries in the order of the id list,
 * so put a fetched batch back into `orderedIds` order, dropping ids it did not return.
 */
export function orderEntriesByIds<T extends { sys: { id: string } }>(
  entries: T[],
  orderedIds: string[]
): T[] {
  const byId = new Map(entries.map((entry) => [entry.sys.id, entry]));
  return orderedIds.flatMap((id) => {
    const entry = byId.get(id);
    return entry ? [entry] : [];
  });
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
