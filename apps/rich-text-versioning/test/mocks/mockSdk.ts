import { vi } from 'vitest';
import { mockCma } from './mockCma';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn().mockImplementation((callback: () => Promise<any>) => {
      mockSdk.app.onConfigureCallback = callback;
    }),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
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
    invocation: {
      currentField: null,
      publishedField: null,
    },
  },
  locales: {
    default: 'en-US',
  },
};

export { mockSdk };
