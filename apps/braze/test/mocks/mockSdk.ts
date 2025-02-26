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
};

export { mockSdk };
