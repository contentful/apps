import { vi } from 'vitest';

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
};
