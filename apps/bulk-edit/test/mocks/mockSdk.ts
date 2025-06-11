import { vi } from 'vitest';
import { AppExtensionSDK } from '@contentful/app-sdk';

interface MockSDK extends Partial<AppExtensionSDK> {
  cma: {
    contentType: {
      getMany: ReturnType<typeof vi.fn>;
      get: ReturnType<typeof vi.fn>;
    };
    entry: {
      getMany: ReturnType<typeof vi.fn>;
    };
  };
  ids: {
    app: string;
    space: string;
    environment: string;
  };
  location: {
    is: (location: string) => boolean;
  };
  locales: {
    default: string;
    available: string[];
  };
}

const mockSdk: MockSDK = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
    isInstalled: vi.fn(),
    onConfigurationCompleted: vi.fn(),
  },
  ids: {
    app: 'test-app',
    space: 'test-space',
    environment: 'test-environment',
  },
  location: {
    is: (location: string) => location === 'page',
  },
  locales: {
    default: 'en-US',
    available: ['en-US', 'es-AR'],
  },
  cma: {
    contentType: {
      getMany: vi.fn(),
      get: vi.fn(),
    },
    entry: {
      getMany: vi.fn(),
    },
  },
};

export { mockSdk };
