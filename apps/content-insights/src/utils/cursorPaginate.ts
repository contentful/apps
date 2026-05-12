import { FETCH_CONFIG } from './consts';

interface CursorPage<T> {
  items: T[];
  pages?: { next?: string };
}

export type CursorFetcher<T, Q> = (
  query: Q & { limit: number; pageNext?: string }
) => Promise<CursorPage<T>>;

export async function cursorPaginate<T, Q extends Record<string, unknown>>(
  fetcher: CursorFetcher<T, Q>,
  baseQuery: Q
): Promise<T[]> {
  const out: T[] = [];
  let pageNext: string | undefined;
  let limit: number = FETCH_CONFIG.DEFAULT_BATCH_SIZE;

  while (true) {
    try {
      const query = { ...baseQuery, limit, ...(pageNext ? { pageNext } : {}) };
      const page = await fetcher(query);

      out.push(...page.items);
      pageNext = page.pages?.next;
      if (!pageNext) return out;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (!msg.includes('Response size too big')) throw err;

      if (limit <= FETCH_CONFIG.MIN_BATCH_SIZE) {
        throw new Error(
          'Unable to fetch entries: response size too large even with minimal batch size'
        );
      }
      limit = Math.max(FETCH_CONFIG.MIN_BATCH_SIZE, Math.floor(limit / 2));
      // Retry the same page (do not advance pageNext).
    }
  }
}
