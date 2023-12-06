import { vi } from 'vitest';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  field: {
    type: 'text',
  },
  ids: {
    app: 'test-app',
  },
  parameters: {
    installation: {
      defs: {},
    },
  },
  entry: {
    getSys: vi.fn(),
    fields: [],
    getMetadata: vi.fn(),
    getTasks: vi.fn(),
  },
  contentType: {
    sys: {
      id: 'content-type-id',
    },
  },
  access: {
    canEditAppConfig: vi.fn().mockResolvedValue(true),
  },
  location: {
    is: vi.fn().mockReturnValue(true),
  },
};

export { mockSdk };
