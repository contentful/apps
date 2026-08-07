import { vi } from 'vitest';
import { AssetProps, ContentTypeProps, EntryProps, UserProps } from 'contentful-management';
import { CmaClient } from '../../src/locations/Page/types';

const collection = <T>(items: T[], total = items.length) => ({
  sys: { type: 'Array' as const },
  items,
  total,
  skip: 0,
  limit: 100,
});

export interface MockCmaOptions {
  contentTypes?: ContentTypeProps[];
  /** Entries returned for entry queries, keyed by content type id. */
  entriesByContentType?: Record<string, EntryProps[]>;
  /** Assets returned for asset queries. */
  assets?: AssetProps[];
  /** Space users returned for the creator-name lookup. */
  users?: UserProps[];
  /**
   * Incoming-reference totals for links_to_entry / links_to_asset count
   * queries, keyed by target id. Ids absent here count as unreferenced.
   */
  referenceCounts?: Record<string, number>;
  /** Entry/asset ids whose archive call should reject. */
  failArchiveIds?: string[];
}

export const createMockCma = ({
  contentTypes = [],
  entriesByContentType = {},
  assets = [],
  users = [],
  referenceCounts = {},
  failArchiveIds = [],
}: MockCmaOptions = {}) => {
  const contentTypeGetMany = vi.fn().mockResolvedValue(collection(contentTypes));
  const entryGetMany = vi
    .fn()
    .mockImplementation(({ query }: { query: Record<string, unknown> }) => {
      // Reference-count queries (limit: 0) only read the collection total.
      if ('links_to_entry' in query || 'links_to_asset' in query) {
        const targetId = (query.links_to_entry ?? query.links_to_asset) as string;
        return Promise.resolve(collection([], referenceCounts[targetId] ?? 0));
      }
      const entries = entriesByContentType[query.content_type as string] ?? [];
      if (query.skip && (query.skip as number) >= entries.length) {
        return Promise.resolve(collection([], entries.length));
      }
      return Promise.resolve(collection(entries));
    });
  const assetGetMany = vi
    .fn()
    .mockImplementation(({ query }: { query: Record<string, unknown> }) => {
      if (query.skip && (query.skip as number) >= assets.length) {
        return Promise.resolve(collection([], assets.length));
      }
      return Promise.resolve(collection(assets));
    });
  const userGetManyForSpace = vi
    .fn()
    .mockImplementation(({ query }: { query: Record<string, unknown> }) => {
      // Mirror the sys.id[in] filter so tests can model users who left the
      // space (present in an entry's createdBy but absent here).
      const requestedIds = String(query['sys.id[in]'] ?? '').split(',');
      return Promise.resolve(
        collection(users.filter((user) => requestedIds.includes(user.sys.id)))
      );
    });
  const rejectOrResolve = (id: string) =>
    failArchiveIds.includes(id)
      ? Promise.reject(new Error(`Cannot archive ${id}`))
      : Promise.resolve({ sys: { id } });
  const entryArchive = vi
    .fn()
    .mockImplementation(({ entryId }: { entryId: string }) => rejectOrResolve(entryId));
  const assetArchive = vi
    .fn()
    .mockImplementation(({ assetId }: { assetId: string }) => rejectOrResolve(assetId));

  const cma = {
    contentType: { getMany: contentTypeGetMany },
    entry: { getMany: entryGetMany, archive: entryArchive },
    asset: { getMany: assetGetMany, archive: assetArchive },
    user: { getManyForSpace: userGetManyForSpace },
  };

  return {
    cma: cma as unknown as CmaClient,
    contentTypeGetMany,
    entryGetMany,
    entryArchive,
    assetGetMany,
    assetArchive,
    userGetManyForSpace,
  };
};
