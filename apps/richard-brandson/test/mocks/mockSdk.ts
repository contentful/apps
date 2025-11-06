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
    space: 'test-space',
    environment: 'test-environment',
  },
  notifier: {
    error: vi.fn(),
    success: vi.fn(),
  },
  parameters: {
    installation: {
      githubModelsApiKey: 'test-github-token',
    },
  },
};

export { mockSdk };
