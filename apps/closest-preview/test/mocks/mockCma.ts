import { vi } from 'vitest';

const mockCma: any = {
  contentType: {
    getMany: vi.fn().mockResolvedValue({ items: [] }),
  },
  editorInterface: {
    getMany: vi.fn().mockResolvedValue({ items: [] }),
  },
  entry: {
    getMany: vi.fn().mockResolvedValue({
      items: [
        {
          sys: {
            id: 'Entry id 1',
            updatedAt: '2021-01-01',
          },
        },
        {
          sys: {
            id: 'Entry id 2',
            updatedAt: '2021-01-01',
          },
        },
        {
          sys: {
            id: 'Entry id 3',
            updatedAt: '2021-01-01',
          },
        },
        {
          sys: {
            id: 'Entry id 4',
            updatedAt: '2021-01-01',
          },
        },
        {
          sys: {
            id: 'Entry id 5',
            updatedAt: '2021-01-01',
          },
        },
        {
          sys: {
            id: 'Entry id 6',
            updatedAt: '2021-01-01',
          },
        },
      ],
    }),
  },
};

export { mockCma };
