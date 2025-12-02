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
  dialogs: {
    openCurrentApp: vi.fn(),
  },
  locales: {
    default: 'en-US',
    available: vi.fn(),
    names: {
      'en-US': 'English (United States)',
      de: 'German',
      fr: 'French',
      'es-ES': 'Spanish (Spain)',
    },
  },
  close: vi.fn(),
};

export { mockSdk };
