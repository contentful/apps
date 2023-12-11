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
  parameters: {
    instance: [],
    installation: {
      tenantId: mockParameters.tenantId,
    },
  },
  ids: {
    app: 'test-app',
    space: 'xyz789',
    environment: 'master',
  },
  hostnames: {
    webapp: 'app.contentful.com',
  },
  cma: {
    contentType: {
      getMany: vi.fn().mockReturnValueOnce({}),
    },
    appActionCall: {
      createWithResponse: vi.fn(),
    },
  },
};

export { mockSdk, mockParameters };
