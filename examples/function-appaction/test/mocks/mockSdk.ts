import { mockCma } from './mockCma';
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
  },
  cma: mockCma,
  hostnames: {
    webapp: 'app.contentful.com',
  },
};

export { mockSdk };
