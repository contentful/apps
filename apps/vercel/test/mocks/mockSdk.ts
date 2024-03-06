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
      selectedProject: 'test-project-id',
      projects: [
        {
          id: 'test-project-id',
          name: 'test project',
        },
      ],
    },
  },
  ids: {
    app: 'test-app',
  },
  cma: {
    contentType: {
      getMany: vi.fn().mockReturnValueOnce({}),
    },
    appActionCall: {
      createWithResponse: vi.fn(),
    },
  },
  notifier: {
    error: vi.fn(),
  },
};

export { mockSdk };
