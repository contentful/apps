import { vi } from 'vitest';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn().mockImplementation((callback: () => Promise<any>) => {
      mockSdk.app.onConfigureCallback = callback;
    }),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
    onConfigureCallback: null as (() => Promise<any>) | null,
  },
  ids: {
    app: 'test-app',
    space: 'test-space',
    environment: 'test-environment',
  },
  cma: {
    contentType: {
      getMany: vi.fn(),
      get: vi.fn(),
    },
    entry: {
      getPublished: vi.fn(),
    },
  },
  notifier: {
    error: vi.fn(),
  },
  parameters: {
    invocation: {
      currentField: null,
      publishedField: null,
    },
  },
  locales: {
    default: 'en-US',
  },
};

export { mockSdk };
