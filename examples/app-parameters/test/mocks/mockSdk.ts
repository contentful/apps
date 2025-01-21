import { vi } from 'vitest';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  ids: {
    app: 'test-app',
  },
  cma: {
    editorInterface: {
      get: vi.fn().mockReturnValueOnce({}),
    },
    contentType: {
      getMany: vi.fn().mockReturnValueOnce([]),
    },
  },
  parameters: {
    instance: '#98CBFF',
    invocation: {
      fieldDetails: '[]',
    },
    installation: {
      displayFieldDetails: true,
      displayEditLink: true,
    },
  },
  hostnames: {
    webapp: 'https://app.contentful.com',
  },
  contentType: {
    sys: {
      id: 'test-content-type',
    },
    name: 'Test Content Type',
    description: 'Test Content Type Description',
  },
};

export { mockSdk };
