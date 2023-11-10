import { vi } from 'vitest';

const mockParameters = {
  tenantId: 'abc-123',
  notifications: [],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    contentType: {
      getMany: vi.fn().mockReturnValueOnce({}),
    },
  },
};

export { mockSdk, mockParameters };
