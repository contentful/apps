import { vi } from 'vitest';
import { ContentTypeProps, EntryProps } from 'contentful-management';
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
  /** Entry ids whose archive call should reject. */
  failArchiveIds?: string[];
}

export const createMockCma = ({
  contentTypes = [],
  entriesByContentType = {},
  failArchiveIds = [],
}: MockCmaOptions = {}) => {
  const contentTypeGetMany = vi.fn().mockResolvedValue(collection(contentTypes));
  const entryGetMany = vi
    .fn()
    .mockImplementation(({ query }: { query: Record<string, unknown> }) => {
      const entries = entriesByContentType[query.content_type as string] ?? [];
      if (query.skip && (query.skip as number) >= entries.length) {
        return Promise.resolve(collection([], entries.length));
      }
      return Promise.resolve(collection(entries));
    });
  const entryArchive = vi.fn().mockImplementation(({ entryId }: { entryId: string }) => {
    if (failArchiveIds.includes(entryId)) {
      return Promise.reject(new Error(`Cannot archive ${entryId}`));
    }
    return Promise.resolve({ sys: { id: entryId } });
  });

  const cma = {
    contentType: { getMany: contentTypeGetMany },
    entry: { getMany: entryGetMany, archive: entryArchive },
  };

  return { cma: cma as unknown as CmaClient, contentTypeGetMany, entryGetMany, entryArchive };
};
