import { vi } from 'vitest';

const mockCma = {
  app: {
    getAppDefinition: vi.fn().mockResolvedValue({
      sys: {
        id: 'app-definition-id',
      },
      parameters: {
        instanceParameters: {
          klaviyoApiKey: 'api-key-from-cma',
        },
      },
    }),
    updateAppDefinition: vi.fn().mockResolvedValue({ success: true }),
  },
  space: {
    getContentTypes: vi.fn().mockResolvedValue({
      items: [
        {
          sys: { id: 'blogPost' },
          name: 'Blog Post',
          fields: [
            { id: 'title', name: 'Title', type: 'Symbol' },
            { id: 'content', name: 'Content', type: 'Text' },
            { id: 'image', name: 'Featured Image', type: 'Link', linkType: 'Asset' },
          ],
        },
      ],
    }),
    getAssets: vi.fn().mockResolvedValue({
      items: [
        {
          sys: { id: 'asset1' },
          fields: {
            title: { 'en-US': 'Test Image' },
            file: { 'en-US': { url: '//images.ctfassets.net/test.jpg' } },
          },
        },
      ],
    }),
  },
  asset: {
    getMany: vi.fn().mockResolvedValue({
      items: [
        {
          sys: { id: 'asset1' },
          fields: {
            title: { 'en-US': 'Test Image' },
            file: { 'en-US': { url: '//images.ctfassets.net/test.jpg' } },
          },
        },
      ],
    }),
  },
  entry: {
    get: vi.fn().mockResolvedValue({
      sys: { id: 'entry1' },
      fields: {
        title: { 'en-US': 'Test Entry' },
      },
    }),
    publish: vi.fn().mockResolvedValue({ sys: { publishedVersion: 1 } }),
  },
};

export { mockCma };
