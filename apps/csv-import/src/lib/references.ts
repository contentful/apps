import { chunk } from './utils';

/**
 * Batch check if entry IDs exist
 * Returns a Set of existing entry IDs
 */
export async function batchCheckReferences(
  entryIds: string[],
  checkFn: (id: string) => Promise<boolean>
): Promise<Set<string>> {
  const uniqueIds = Array.from(new Set(entryIds));
  const existingIds = new Set<string>();

  // Check in chunks to avoid overwhelming the API
  const chunks = chunk(uniqueIds, 50);

  for (const chunkIds of chunks) {
    const results = await Promise.allSettled(
      chunkIds.map(async (id) => {
        const exists = await checkFn(id);
        return { id, exists };
      })
    );

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.exists) {
        existingIds.add(result.value.id);
      }
    });
  }

  return existingIds;
}

/**
 * Extract all entry IDs from a value (handles strings and arrays)
 */
export function extractEntryIds(value: any): string[] {
  const ids: string[] = [];

  if (typeof value === 'string') {
    ids.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => {
      if (typeof item === 'string') {
        ids.push(item);
      }
    });
  }

  return ids.filter((id) => id && id.trim().length > 0);
}
