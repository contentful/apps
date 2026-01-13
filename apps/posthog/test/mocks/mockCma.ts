import { vi } from 'vitest';

export const mockCma: any = {
  appActionCall: {
    createWithResponse: vi.fn(),
  },
  contentType: {
    getMany: vi.fn().mockResolvedValue({
      items: [
        {
          sys: { id: 'blogPost' },
          name: 'Blog Post',
          fields: [
            { id: 'title', name: 'Title', type: 'Symbol' },
            { id: 'slug', name: 'Slug', type: 'Symbol' },
            { id: 'content', name: 'Content', type: 'RichText' },
          ],
        },
      ],
    }),
  },
};
