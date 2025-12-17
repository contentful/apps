import { vi } from 'vitest';
import { EntryProps } from 'contentful-management';

const mockCma: any = {
  contentType: {
    get: vi.fn(),
    getMany: vi.fn().mockResolvedValue({
      items: [
        { sys: { id: 'blogPost' }, name: 'Blog Post' },
        { sys: { id: 'article' }, name: 'Article' },
        { sys: { id: 'page' }, name: 'Page' },
      ],
    }),
  },
  entry: {
    getMany: vi.fn(),
  },
};

export const getManyEntries = (entries: EntryProps[], total?: number) => {
  return {
    items: entries,
    total: total ?? entries.length,
    skip: 0,
    limit: 1000,
    sys: { type: 'Array' },
  };
};

export { mockCma };
