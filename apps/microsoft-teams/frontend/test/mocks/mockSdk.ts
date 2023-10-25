import { vi } from 'vitest';

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
};

export { mockSdk };
