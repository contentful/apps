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
    environment: 'test-env',
    organization: 'test-org',
  },
  parameters: {
    installation: {},
  },
  locales: {
    default: 'en-US',
  },
  entry: {
    fields: {},
  },
  navigator: {
    openEntry: vi.fn(),
    openAppConfig: vi.fn(),
  },
  cma: {},
  location: { is: vi.fn().mockReturnValue(false) },
};

export { mockSdk };
