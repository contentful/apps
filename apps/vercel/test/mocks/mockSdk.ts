import { vi } from 'vitest';

export const mockParameters = {
  vercelAccessToken: 'abc-123',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
    onConfigurationCompleted: vi.fn(),
    isInstalled: vi.fn().mockReturnValue(true),
  },
  parameters: {
    instance: [],
    installation: {
      vercelAccessToken: mockParameters.vercelAccessToken,
    },
  },
  ids: {
    app: 'test-app',
  },
  notifier: {
    error: vi.fn(),
  },
};

export { mockSdk };
