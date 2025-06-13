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
      update: ReturnType<typeof vi.fn>;
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
    names: Record<string, string>;
    fallbacks: Record<string, string>;
    optional: Record<string, boolean>;
    direction: Record<string, 'ltr' | 'rtl'>;
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
    names: {
      'en-US': 'English (United States)',
      'es-AR': 'Spanish (Argentina)',
    },
    fallbacks: {
      'en-US': 'en-US',
      'es-AR': 'en-US',
    },
    optional: {
      'en-US': false,
      'es-AR': true,
    },
    direction: {
      'en-US': 'ltr',
      'es-AR': 'ltr',
    },
  },
  cma: {
    contentType: {
      getMany: vi.fn(),
      get: vi.fn(),
    },
    entry: {
      getMany: vi.fn(),
      update: vi.fn(),
    },
  },
};

export { mockSdk };
