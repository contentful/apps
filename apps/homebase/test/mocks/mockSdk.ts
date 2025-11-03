import { vi } from 'vitest';
import { mockCma } from './mockCma';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  cma: mockCma,
  ids: {
    app: 'test-app',
  },
  navigator: {
    openNewEntry: vi.fn(),
  },
  locales: {
    default: 'en-US',
    available: ['en-US', 'es-ES'],
    direction: {
      'en-US': 'ltr',
      'es-ES': 'ltr',
    },
  },
  notifier: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
};

export { mockSdk };
