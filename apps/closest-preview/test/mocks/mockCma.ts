import { vi } from 'vitest';

const mockCma: any = {
  contentType: {
    getMany: vi.fn().mockResolvedValue({ items: [] }),
  },
  editorInterface: {
    getMany: vi.fn().mockResolvedValue({ items: [] }),
  },
  entry: {
    get: vi.fn().mockResolvedValue({
      sys: { id: 'root-entry', updatedAt: '2021-01-01' },
      fields: { title: { 'en-US': 'Root Entry' }, slug: { 'en-US': undefined } },
    }),
    getMany: vi.fn().mockResolvedValue({
      items: [
        {
          sys: {
            id: 'Entry id 1',
            updatedAt: '2021-01-01',
          },
          fields: { title: { 'en-US': 'Entry Title 1' }, slug: { 'en-US': 'entry-1' } },
        },
        {
          sys: {
            id: 'Entry id 2',
            updatedAt: '2021-01-01',
          },
          fields: { title: { 'en-US': '' }, slug: { 'en-US': 'entry-2' } },
        },
        {
          sys: {
            id: 'Entry id 3',
            updatedAt: '2021-01-01',
          },
          fields: { title: { 'en-US': undefined }, slug: { 'en-US': 'entry-3' } },
        },
        {
          sys: {
            id: 'Entry id 4',
            updatedAt: '2021-01-01',
          },
          fields: { title: { 'en-US': 'Entry Title 4' }, slug: { 'en-US': 'entry-4' } },
        },
        {
          sys: {
            id: 'Entry id 5',
            updatedAt: '2021-01-01',
          },
          fields: { title: { 'en-US': 'Entry Title 5' }, slug: { 'en-US': 'entry-5' } },
        },
        {
          sys: {
            id: 'Entry id 6',
            updatedAt: '2021-01-01',
          },
          fields: { title: { 'en-US': 'Non-root (no slug)' }, slug: { 'en-US': undefined } },
        },
      ],
    }),
  },
};

export { mockCma };
