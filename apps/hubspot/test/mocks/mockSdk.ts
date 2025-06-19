import { vi } from 'vitest';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  notifier: {
    error: vi.fn(),
  },
  ids: {
    app: 'test-app',
  },
};

export { mockSdk };
