import { vi } from 'vitest';

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
};

export { mockCma };
