import { vi } from 'vitest';
import { mockCma } from './mockCma';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockResolvedValue({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn().mockResolvedValue({}),
  },
  cma: mockCma,
  ids: {
    app: 'test-app',
    space: 'test-space',
    environment: 'test-environment',
  },
  notifier: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
};

export { mockSdk };
