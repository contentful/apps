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
  appInstallation: {
    getForOrganization: vi.fn().mockResolvedValue({
      items: [
        {
          sys: {
            space: {
              sys: {
                id: 'test-space',
              },
            },
          },
          parameters: {},
        },
      ],
    }),
  },
  user: {
    getForSpace: vi.fn().mockResolvedValue({
      sys: {
        id: 'user-1',
      },
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    }),
    getManyForSpace: vi.fn().mockResolvedValue({
      items: [],
      total: 0,
    }),
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
