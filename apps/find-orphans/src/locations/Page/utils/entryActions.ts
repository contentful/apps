import { CmaClient, OrphanKind } from '../types';

export interface ArchiveProgress {
  current: number;
  total: number;
}

export interface ArchiveOutcome {
  archivedIds: string[];
  failedIds: string[];
}

/** What the archive action needs to know about one selected result. */
export interface ArchiveTarget {
  id: string;
  /** Decides which CMA endpoint archives it (entries vs assets). */
  kind: OrphanKind;
}

/**
 * Archives the given entries and assets in small concurrent batches so the
 * CMA rate limit (7 req/s per space) is respected. One failed archive never
 * aborts the rest of the batch; failures are collected so the caller can
 * report them and keep the items listed.
 */
export const archiveOrphans = async (
  cma: CmaClient,
  targets: ArchiveTarget[],
  batchSize: number,
  onProgress: (progress: ArchiveProgress) => void
): Promise<ArchiveOutcome> => {
  const archivedIds: string[] = [];
  const failedIds: string[] = [];

  for (let i = 0; i < targets.length; i += batchSize) {
    const batch = targets.slice(i, i + batchSize);
    onProgress({ current: Math.min(i + batch.length, targets.length), total: targets.length });
    await Promise.all(
      batch.map(async ({ id, kind }) => {
        try {
          // Drafts are always unpublished, so archiving cannot fail on the
          // "published items cannot be archived" rule; failures here are
          // permissions or version conflicts.
          if (kind === 'entry') {
            await cma.entry.archive({ entryId: id });
          } else {
            await cma.asset.archive({ assetId: id });
          }
          archivedIds.push(id);
        } catch {
          failedIds.push(id);
        }
      })
    );
  }

  return { archivedIds, failedIds };
};
