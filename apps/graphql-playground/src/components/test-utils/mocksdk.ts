import { vi } from 'vitest';

const mockSdk: any = {
  window: {
    // updateHeight: vi.fn().mockReturnValue(null),
    startAutoResizer: vi.fn(),
  },
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
    space: 'test-space',
  },
  hostnames: {
    webapp: 'localhost',
  },
};

export { mockSdk };
