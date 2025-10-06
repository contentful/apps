import { vi } from 'vitest';
import { mockCma } from './mockCma';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockResolvedValue({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn().mockResolvedValue({}),
  },
  ids: {
    app: 'test-app',
    space: 'test-space',
    environment: 'master',
  },
  cma: mockCma,
  hostnames: {
    webapp: 'app.contentful.com',
  },
  notifier: {
    error: vi.fn(),
    success: vi.fn(),
  },
};

export { mockSdk };
