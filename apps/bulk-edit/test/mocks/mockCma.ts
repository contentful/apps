import { vi } from 'vitest';
import { Collection, ContentTypeProps, EntryProps } from 'contentful-management';

export const createMockCma = () => {
  return {
    contentType: {
      getMany: vi.fn(),
      get: vi.fn(),
    },
    entry: {
      getMany: vi.fn(),
    },
  };
};
export const getManyContentTypes = (contentTypes: ContentTypeProps[]) => {
  return {
    items: contentTypes,
    total: contentTypes.length,
    skip: 0,
    limit: 100,
    sys: { type: 'Array' },
  };
};

export const getManyEntries = (entries: EntryProps[]) => {
  return {
    items: entries,
    total: entries.length,
    skip: 0,
    limit: 100,
    sys: { type: 'Array' },
  };
};
