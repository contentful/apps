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
  ids: {
    app: 'test-app',
    user: 'user-id',
  },
  notifier: {
    error: vi.fn(),
  },
  parameters: {
    installation: {},
    instance: {},
  },
};

export { mockSdk };
