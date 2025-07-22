import { vi } from 'vitest';
import { mockCma } from './mockCma';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn(),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  ids: {
    app: 'test-app',
  },
  cma: mockCma,
  hostnames: {
    delivery: 'test-delivery.contentful.com',
  },
};

const defaultMockSdk = {
  ids: {
    space: 'space-id',
    entry: 'entry-id',
  },
  parameters: {
    installation: {
      contentfulApiKey: 'api-key',
    },
  },
  locales: {
    available: ['en-US'],
  },
};

export { mockSdk, defaultMockSdk };
