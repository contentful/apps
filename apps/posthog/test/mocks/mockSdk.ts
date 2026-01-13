import { vi } from 'vitest';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValue({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  ids: {
    app: 'test-app',
    entry: 'test-entry-123',
    contentType: 'blogPost',
    space: 'test-space',
    environment: 'master',
  },
  parameters: {
    installation: {
      personalApiKey: 'phx_test_key',
      projectId: '12345',
      posthogHost: 'https://us.posthog.com',
      urlMappings: [
        {
          contentTypeId: 'blogPost',
          urlPattern: 'https://example.com/blog/{slug}',
        },
      ],
    },
    instance: {},
  },
  contentType: {
    sys: {
      id: 'blogPost',
    },
    displayField: 'title',
    fields: [
      { id: 'title', name: 'Title', type: 'Symbol' },
      { id: 'slug', name: 'Slug', type: 'Symbol' },
      { id: 'body', name: 'Body', type: 'Text' },
    ],
  },
  entry: {
    fields: {
      title: {
        getValue: vi.fn().mockReturnValue('Hello World'),
        onValueChanged: vi.fn().mockReturnValue(() => {}),
      },
      slug: {
        getValue: vi.fn().mockReturnValue('hello-world'),
        onValueChanged: vi.fn().mockReturnValue(() => {}),
      },
      body: {
        getValue: vi.fn().mockReturnValue('This is the body content'),
        onValueChanged: vi.fn().mockReturnValue(() => {}),
      },
    },
    getSys: vi.fn().mockReturnValue({
      id: 'test-entry-123',
      publishedAt: '2026-01-10T10:00:00Z',
    }),
    onSysChanged: vi.fn().mockReturnValue(() => {}),
  },
  navigator: {
    openAppConfig: vi.fn(),
    openCurrentAppPage: vi.fn(),
  },
  notifier: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
  window: {
    startAutoResizer: vi.fn(),
    stopAutoResizer: vi.fn(),
  },
  dialogs: {
    openCurrentApp: vi.fn(),
  },
  cma: {},
  cmaAdapter: {},
};

// Helper to create SDK with custom parameters
export const createMockSdk = (overrides: Partial<typeof mockSdk> = {}) => {
  return {
    ...mockSdk,
    ...overrides,
    parameters: {
      ...mockSdk.parameters,
      ...(overrides.parameters || {}),
      installation: {
        ...mockSdk.parameters.installation,
        ...(overrides.parameters?.installation || {}),
      },
    },
    entry: {
      ...mockSdk.entry,
      ...(overrides.entry || {}),
      fields: {
        ...mockSdk.entry.fields,
        ...(overrides.entry?.fields || {}),
      },
    },
  };
};

// SDK with missing configuration
export const mockSdkUnconfigured = createMockSdk({
  parameters: {
    installation: {
      personalApiKey: '',
      projectId: '',
      posthogHost: '',
      urlMappings: [],
    },
    instance: {},
  },
});

// SDK with no URL mapping for current content type
export const mockSdkNoMapping = createMockSdk({
  parameters: {
    installation: {
      personalApiKey: 'phx_test_key',
      projectId: '12345',
      posthogHost: 'https://us.posthog.com',
      urlMappings: [
        {
          contentTypeId: 'differentContentType',
          urlPattern: 'https://example.com/other/{slug}',
        },
      ],
    },
    instance: {},
  },
});

// SDK with no slug field value
export const mockSdkNoSlug = createMockSdk({
  contentType: {
    sys: {
      id: 'blogPost',
    },
    displayField: 'title',
    fields: [
      { id: 'title', name: 'Title', type: 'Symbol' },
      { id: 'slug', name: 'Slug', type: 'Symbol' },
    ],
  },
  entry: {
    fields: {
      title: {
        getValue: vi.fn().mockReturnValue(''),
        onValueChanged: vi.fn().mockReturnValue(() => {}),
      },
      slug: {
        getValue: vi.fn().mockReturnValue(''),
        onValueChanged: vi.fn().mockReturnValue(() => {}),
      },
    },
    getSys: vi.fn().mockReturnValue({ id: 'test-entry-123' }),
    onSysChanged: vi.fn().mockReturnValue(() => {}),
  },
});

export { mockSdk };
