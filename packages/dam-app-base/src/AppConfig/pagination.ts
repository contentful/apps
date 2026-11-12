/**
 * The CMA returns 100 items per page by default and allows at most 1000.
 * Without an explicit `limit`/`skip`, collection endpoints silently truncate.
 */
export const PAGE_SIZE = 1000;

export interface PageQuery {
  limit: number;
  skip: number;
}

/**
 * Fetches every page of a CMA collection and returns the concatenated items.
 * A page shorter than `limit` is the last one.
 */
export async function fetchAllPages<T>(
  fetchPage: (query: PageQuery) => Promise<{ items?: T[] }>,
  limit: number = PAGE_SIZE
): Promise<T[]> {
  const all: T[] = [];
  let skip = 0;
  let fetched: number;

  do {
    const response = await fetchPage({ limit, skip });
    const items = response.items ?? [];
    all.push(...items);
    fetched = items.length;
    skip += limit;
  } while (fetched === limit);

  return all;
}
