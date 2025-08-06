import { vi } from 'vitest';

const mockCma: any = {
  contentType: {
    getMany: vi.fn().mockResolvedValue({
      items: [
        {
          sys: { id: 'blog-post' },
          name: 'Blog Post',
          fields: [
            { id: 'title', name: 'Title', type: 'Text' },
            { id: 'content', name: 'Content', type: 'RichText' },
          ],
        },
        {
          sys: { id: 'article' },
          name: 'Article',
          fields: [
            { id: 'title', name: 'Title', type: 'Text' },
            { id: 'body', name: 'Body', type: 'RichText' },
          ],
        },
      ],
      total: 2,
    }),
    get: vi.fn().mockResolvedValue({
      sys: { id: 'test-content-type' },
      name: 'Test Content Type',
      fields: [
        { id: 'title', name: 'Title', type: 'Text' },
        { id: 'content', name: 'Content', type: 'RichText' },
      ],
    }),
  },
};

export { mockCma };
