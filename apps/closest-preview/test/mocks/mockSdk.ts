import { vi } from 'vitest';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockResolvedValue({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn().mockResolvedValue({}),
  },
  ids: {
    app: 'test-app',
    space: 'test-space',
    environment: 'master',
  },
  cma: null,
  notifier: {
    error: vi.fn(),
    success: vi.fn(),
  },
};

export { mockSdk };
