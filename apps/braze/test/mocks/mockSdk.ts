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
      entryId: 'test-entryId',
      entryFields: [], // TODO: add fields?
      contentTypeId: 'test-contentTypeId',
    },
  },
};

export { mockSdk };
