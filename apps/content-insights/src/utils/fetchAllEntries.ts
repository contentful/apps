import { BaseAppSDK } from '@contentful/app-sdk';
import { EntryProps } from 'contentful-management';
import { FETCH_CONFIG } from './consts';
import { concurrentMap } from './concurrentMap';
import { cursorPaginate } from './cursorPaginate';

export interface FetchAllEntriesResult {
  entries: EntryProps[];
  total: number;
  fetchedAt: Date;
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
    cursorPaginate<EntryProps, { content_type: string }>(
      async ({ pageNext, ...rest }) => {
        const response = await sdk.cma.entry.getManyWithCursor({
          query: pageNext ? { ...rest, pageNext } : rest,
        });
        return {
          items: response.items as EntryProps[],
          pages: response.pages,
        };
      },
      { content_type: contentTypeId }
    )
  );

  const entries = buckets.flat();
  return { entries, total: entries.length, fetchedAt };
}
