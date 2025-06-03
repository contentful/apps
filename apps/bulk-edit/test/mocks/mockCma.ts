import { vi } from 'vitest';
import { Collection, EntryProps } from 'contentful-management';
import { mockContentTypes, mockContentType } from './mockContentTypes';
import { mockEntries } from './mockEntries';

export const createMockCma = (
  options: {
    delay?: number;
    shouldError?: boolean;
    errorMessage?: string;
  } = {}
) => {
  const { delay = 0, shouldError = false, errorMessage = 'Failed to fetch' } = options;

  const createDelayedPromise = <T>(value: T) => {
    return new Promise<T>((resolve, reject) => {
      setTimeout(() => {
        if (shouldError) {
          reject(new Error(errorMessage));
        } else {
          resolve(value);
        }
      }, delay);
    });
  };

  return {
    contentType: {
      getMany: vi.fn().mockImplementation(() =>
        createDelayedPromise<Collection<typeof mockContentType, typeof mockContentType>>({
          items: mockContentTypes,
          total: mockContentTypes.length,
          skip: 0,
          limit: 100,
          sys: { type: 'Array' },
          toPlainObject: () => ({
            items: mockContentTypes,
            total: mockContentTypes.length,
            skip: 0,
            limit: 100,
            sys: { type: 'Array' },
          }),
        })
      ),
      get: vi
        .fn()
        .mockImplementation(({ contentTypeId }) =>
          createDelayedPromise(
            mockContentTypes.find((ct) => ct.sys.id === contentTypeId) || mockContentType
          )
        ),
    },
    entry: {
      getMany: vi.fn().mockImplementation(({ query }) => {
        const entries = mockEntries[query.content_type] || [];
        return createDelayedPromise<Collection<EntryProps, EntryProps>>({
          items: entries,
          total: entries.length,
          skip: 0,
          limit: 100,
          sys: { type: 'Array' },
          toPlainObject: () => ({
            items: entries,
            total: entries.length,
            skip: 0,
            limit: 100,
            sys: { type: 'Array' },
          }),
        });
      }),
    },
  };
};
