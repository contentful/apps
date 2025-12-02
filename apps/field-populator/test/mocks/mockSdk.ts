import { vi } from 'vitest';
import { mockCma } from './mockCma';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn().mockImplementation((callback: () => Promise<any>) => {
      mockSdk.app.onConfigureCallback = callback;
    }),
    getParameters: vi.fn().mockResolvedValue({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn().mockResolvedValue({}),
    onConfigureCallback: null as (() => Promise<any>) | null,
  },
  ids: {
    app: 'test-app',
    space: 'test-space',
    environment: 'test-environment',
  },
  cma: mockCma,
  notifier: {
    error: vi.fn(),
  },
  parameters: {
    invocation: {},
  },
  locales: {
    default: 'en-US',
  },
  dialogs: {
    openCurrentApp: vi.fn(),
  },
};

export { mockSdk };
