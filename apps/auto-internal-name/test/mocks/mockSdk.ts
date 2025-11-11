import { vi } from 'vitest';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockResolvedValue(null),
    setReady: vi.fn(),
    getCurrentState: vi.fn().mockResolvedValue({}),
  },
  ids: {
    app: 'test-app',
    space: 'test-space',
    environment: 'test-environment',
  },
  cma: {
    contentType: {
      getMany: vi.fn(),
    },
  },
};

export { mockSdk };
