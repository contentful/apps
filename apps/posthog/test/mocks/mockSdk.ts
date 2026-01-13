import { vi } from 'vitest';

// Base mock SDK with all fields configured correctly
export const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValue({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  ids: {
    app: 'posthog-analytics',
    space: 'test-space-id',
    environment: 'master',
    environmentAlias: undefined,
  },
  parameters: {
    installation: {
      posthogApiKey: 'phx_test_api_key',
      posthogProjectId: '12345',
      posthogHost: 'us',
      contentTypes: {
        blogPost: {
          slugField: 'slug',
          urlPrefix: 'https://example.com/blog/',
        },
      },
    },
  },
  entry: {
    getSys: vi.fn().mockReturnValue({
      id: 'test-entry-id',
      contentType: { sys: { id: 'blogPost' } },
    }),
    fields: {
      slug: {
        getValue: vi.fn().mockReturnValue('my-test-post'),
      },
    },
  },
  contentType: {
    sys: {
      id: 'blogPost',
    },
  },
  access: {
    canEditAppConfig: vi.fn().mockResolvedValue(true),
  },
  location: {
    is: vi.fn().mockReturnValue(true),
  },
  locales: {
    default: 'en-US',
    available: ['en-US'],
  },
  window: {
    startAutoResizer: vi.fn(),
  },
  notifier: {
    success: vi.fn(),
    error: vi.fn(),
  },
  navigator: {
    openAppConfig: vi.fn().mockResolvedValue(undefined),
    openEntry: vi.fn().mockResolvedValue(undefined),
  },
};

// Mock SDK with no installation parameters (app not configured)
export const mockSdkUnconfigured: any = {
  ...mockSdk,
  parameters: {
    installation: {},
  },
};

// Mock SDK with no URL mapping for the current content type
export const mockSdkNoMapping: any = {
  ...mockSdk,
  parameters: {
    installation: {
      posthogApiKey: 'phx_test_api_key',
      posthogProjectId: '12345',
      posthogHost: 'us',
      contentTypes: {
        // Different content type, not matching blogPost
        landingPage: {
          slugField: 'pageUrl',
          urlPrefix: 'https://example.com/',
        },
      },
    },
  },
};

// Mock SDK with empty slug field
export const mockSdkNoSlug: any = {
  ...mockSdk,
  entry: {
    ...mockSdk.entry,
    fields: {
      slug: {
        getValue: vi.fn().mockReturnValue(''),
      },
    },
  },
};
