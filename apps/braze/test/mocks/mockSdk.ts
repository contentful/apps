import { vi } from 'vitest';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  ids: {
    app: 'test-app',
    spaceId: 'test-spaceId',
  },
  dialogs: {
    openCurrentApp: vi.fn(),
  },
  parameters: {
    installation: {
      apiKey: 'test-apiKey',
    },
    invocation: {
      id: 'test-entryId',
      contentTypeId: 'test-contentTypeId',
    },
  },
  locales: {
    default: 'en-US',
    available: ['en-US', 'es-AR'],
  },
};

export { mockSdk };
