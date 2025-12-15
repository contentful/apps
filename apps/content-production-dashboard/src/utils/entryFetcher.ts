import { PageAppSDK } from '@contentful/app-sdk';
import { EntryProps } from 'contentful-management';
import { FETCH_CONFIG } from './cacheConstants';

export interface FetchAllEntriesResult {
  entries: EntryProps[];
  total: number;
  fetchedAt: Date;
}

/**
 * Fetches all entries from the space with pagination and batching.
 * Handles response size limits by automatically reducing batch size if needed.
 *
 * @param sdk - Contentful PageAppSDK instance
 * @returns Promise with all entries, total count, and fetch timestamp
 */
export async function fetchAllEntries(sdk: PageAppSDK): Promise<FetchAllEntriesResult> {
  const allEntries: EntryProps[] = [];
  let batchSkip = 0;
  let total = 0;
  let hasMore = true;
  let batchSize: number = FETCH_CONFIG.DEFAULT_BATCH_SIZE;

  while (hasMore) {
    try {
      const response = await sdk.cma.entry.getMany({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        query: {
          skip: batchSkip,
          limit: batchSize,
        },
      });

      const items = response.items as EntryProps[];
      const batchTotal = response.total || 0;

      // Set total on first batch
      if (total === 0) {
        total = batchTotal;
      }

      allEntries.push(...items);

      // Check if we should continue fetching
      hasMore = items.length === batchSize && allEntries.length < total;

      if (hasMore) {
        batchSkip += batchSize;
      }
    } catch (error: any) {
      // If we hit response size limit, reduce batch size and retry
      if (error.message && error.message.includes('Response size too big')) {
        if (batchSize > FETCH_CONFIG.MIN_BATCH_SIZE) {
          const newBatchSize = Math.floor(batchSize / 2);
          console.warn(
            `Response size limit hit, reducing batch size from ${batchSize} to ${newBatchSize}`
          );
          batchSize = newBatchSize;
          // Retry with smaller batch size (don't advance batchSkip)
          continue;
        } else {
          throw new Error(
            'Unable to fetch entries: response size too large even with minimal batch size'
          );
        }
      } else {
        throw error;
      }
    }
  }

  return {
    entries: allEntries,
    total,
    fetchedAt: new Date(),
  };
}
