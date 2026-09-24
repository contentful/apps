import { vi } from 'vitest';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
    isInstalled: vi.fn(),
    onConfigurationCompleted: vi.fn(),
  },
  cma: {
    appSignedRequest: {
      create: () => ({}),
    },
    contentType: {
      getMany: vi.fn().mockResolvedValue({ items: [] }),
    },
  },
  ids: {
    app: 'test-app',
    user: 'user-id',
  },
  notifier: {
    error: vi.fn(),
  },
  dialogs: {
    openCurrentApp: vi.fn(),
  },
  close: vi.fn(),
  parameters: {
    installation: {},
    instance: {},
    invocation: {},
  },
  location: {
    is: vi.fn().mockReturnValue(true),
  },
  contentType: {
    name: 'Category',
  },
};

export { mockSdk };
