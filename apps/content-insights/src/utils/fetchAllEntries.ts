import { BaseAppSDK } from '@contentful/app-sdk';
import { EntryProps } from 'contentful-management';
import { FETCH_CONFIG } from './consts';
import { concurrentMap } from './concurrentMap';

export interface FetchAllEntriesResult {
  entries: EntryProps[];
  total: number;
  fetchedAt: Date;
}

async function fetchEntriesForContentType(
  sdk: BaseAppSDK,
  contentTypeId: string
): Promise<EntryProps[]> {
  const out: EntryProps[] = [];
  let skip = 0;
  let limit: number = FETCH_CONFIG.DEFAULT_BATCH_SIZE;

  while (true) {
    try {
      const response = await sdk.cma.entry.getMany({
        query: { content_type: contentTypeId, skip, limit },
      });
      const items = response.items as EntryProps[];
      out.push(...items);

      const total = response.total ?? 0;
      if (items.length < limit || out.length >= total) return out;

      skip += limit;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (!msg.includes('Response size too big')) throw err;

      if (limit <= FETCH_CONFIG.MIN_BATCH_SIZE) {
        throw new Error(
          'Unable to fetch entries: response size too large even with minimal batch size'
        );
      }
      limit = Math.max(FETCH_CONFIG.MIN_BATCH_SIZE, Math.floor(limit / 2));
      // Retry the same page (do not advance skip).
    }
  }
}

export async function fetchAllEntries(
  sdk: BaseAppSDK,
  contentTypeIds: string[]
): Promise<FetchAllEntriesResult> {
  const fetchedAt = new Date();

  if (contentTypeIds.length === 0) {
    return { entries: [], total: 0, fetchedAt };
  }

  const buckets = await concurrentMap(contentTypeIds, FETCH_CONFIG.CONCURRENCY, (contentTypeId) =>
    fetchEntriesForContentType(sdk, contentTypeId)
  );

  const entries = buckets.flat();
  return { entries, total: entries.length, fetchedAt };
}
