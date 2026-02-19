import { vi } from 'vitest';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockResolvedValue(null),
    setReady: vi.fn(),
    getCurrentState: vi.fn().mockResolvedValue(null),
  },
  notifier: {
    error: vi.fn(),
  },
  ids: {
    app: 'test-app',
  },
};

export { mockSdk };
