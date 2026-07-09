import { CmaClient } from '../types';

export interface ArchiveProgress {
  current: number;
  total: number;
}

export interface ArchiveOutcome {
  archivedIds: string[];
  failedIds: string[];
}

/**
 * Archives the given entries in small concurrent batches, mirroring the
 * reference-count batching so the CMA rate limit (7 req/s per space) is
 * respected. One failed archive never aborts the rest of the batch; failures
 * are collected so the caller can report them and keep the entries listed.
 */
export const archiveEntries = async (
  cma: CmaClient,
  entryIds: string[],
  batchSize: number,
  onProgress: (progress: ArchiveProgress) => void
): Promise<ArchiveOutcome> => {
  const archivedIds: string[] = [];
  const failedIds: string[] = [];

  for (let i = 0; i < entryIds.length; i += batchSize) {
    const batch = entryIds.slice(i, i + batchSize);
    onProgress({ current: Math.min(i + batch.length, entryIds.length), total: entryIds.length });
    await Promise.all(
      batch.map(async (entryId) => {
        try {
          // Drafts are always unpublished, so archiving cannot fail on the
          // "published entries cannot be archived" rule; failures here are
          // permissions or version conflicts.
          await cma.entry.archive({ entryId });
          archivedIds.push(entryId);
        } catch {
          failedIds.push(entryId);
        }
      })
    );
  }

  return { archivedIds, failedIds };
};
