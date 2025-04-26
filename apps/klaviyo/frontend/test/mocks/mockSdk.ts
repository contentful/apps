import { vi } from 'vitest';

const mockSdk = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockResolvedValue({
      klaviyoApiKey: 'test-api-key',
      klaviyoCompanyId: 'test-company-id',
    }),
    setReady: vi.fn(),
    getCurrentState: vi.fn().mockReturnValue({
      EditorInterface: {
        sidebar: {
          position: 0,
        },
      },
    }),
    setParameters: vi.fn().mockResolvedValue(undefined),
  },
  ids: {
    app: 'klaviyo-app',
    space: 'test-space',
    environment: 'master',
    user: 'test-user',
    entry: 'test-entry',
    contentType: 'blogPost',
  },
  contentType: {
    sys: {
      id: 'blogPost',
    },
    name: 'Blog Post',
    fields: [
      { id: 'title', name: 'Title', type: 'Symbol' },
      { id: 'content', name: 'Content', type: 'Text' },
      { id: 'image', name: 'Featured Image', type: 'Link', linkType: 'Asset' },
    ],
  },
  entry: {
    getSys: vi.fn().mockReturnValue({
      id: 'test-entry',
      contentType: {
        sys: {
          id: 'blogPost',
        },
      },
    }),
    fields: {
      title: {
        getValue: vi.fn().mockReturnValue('Test Title'),
        onValueChanged: vi.fn().mockReturnValue(() => {}),
      },
      content: {
        getValue: vi.fn().mockReturnValue('Test Content'),
        onValueChanged: vi.fn().mockReturnValue(() => {}),
      },
      image: {
        getValue: vi.fn().mockReturnValue({
          sys: {
            id: 'asset1',
            type: 'Link',
            linkType: 'Asset',
          },
        }),
        onValueChanged: vi.fn().mockReturnValue(() => {}),
      },
    },
  },
  space: {
    getContentType: vi.fn().mockResolvedValue({
      sys: { id: 'blogPost' },
      name: 'Blog Post',
      fields: [
        { id: 'title', name: 'Title', type: 'Symbol' },
        { id: 'content', name: 'Content', type: 'Text' },
        { id: 'image', name: 'Featured Image', type: 'Link', linkType: 'Asset' },
      ],
    }),
    getAsset: vi.fn().mockResolvedValue({
      sys: { id: 'asset1' },
      fields: {
        title: { 'en-US': 'Test Image' },
        file: {
          'en-US': {
            url: '//images.ctfassets.net/test.jpg',
            fileName: 'test.jpg',
            contentType: 'image/jpeg',
          },
        },
      },
    }),
  },
  dialogs: {
    openCurrentApp: vi.fn().mockResolvedValue({
      fieldId: 'content',
      blockName: 'Content Block',
      fieldType: 'text',
    }),
    openConfirm: vi.fn().mockResolvedValue(true),
  },
  notifier: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
  parameters: {
    installation: {
      klaviyoApiKey: 'test-api-key',
      klaviyoCompanyId: 'test-company-id',
    },
    instance: {},
    invocation: {},
  },
  window: {
    startAutoResizer: vi.fn(),
  },
  hostnames: {
    webapp: 'app.contentful.com',
  },
  locales: {
    default: 'en-US',
    available: ['en-US', 'de-DE'],
  },
  location: {
    is: vi.fn().mockImplementation((location) => false),
  },
  close: vi.fn(),
};

export { mockSdk };
