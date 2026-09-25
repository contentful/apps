import { vi } from 'vitest';

const createMockSdk = (overrides?: Record<string, unknown>) => {
  const baseMockSdk = {
    app: {
      onConfigure: vi.fn(),
      onConfigurationCompleted: vi.fn(),
      getParameters: vi.fn().mockResolvedValue(null),
      setReady: vi.fn(),
      getCurrentState: vi.fn().mockResolvedValue(null),
      isInstalled: vi.fn().mockResolvedValue(true),
    },
    notifier: {
      error: vi.fn(),
      success: vi.fn(),
    },
    parameters: {
      installation: {},
    },
    cma: {
      appActionCall: {
        createWithResponse: vi.fn(),
      },
      contentType: {
        getMany: vi.fn().mockResolvedValue({ items: [] }),
        get: vi.fn().mockRejectedValue(new Error('not found')),
        createWithId: vi.fn().mockResolvedValue({ sys: { id: 'asanaTaskLink' } }),
        publish: vi.fn().mockResolvedValue({ sys: { id: 'asanaTaskLink' } }),
      },
      entry: {
        get: vi.fn(),
        getMany: vi.fn().mockResolvedValue({ items: [] }),
        create: vi
          .fn()
          .mockImplementation((_params, entry) =>
            Promise.resolve({ sys: { id: 'mock-link-entry-id' }, ...entry })
          ),
        update: vi.fn().mockImplementation((_params, entry) => Promise.resolve(entry)),
        publish: vi.fn().mockImplementation((_params, entry) => Promise.resolve(entry)),
        unpublish: vi.fn(),
        delete: vi.fn(),
      },
      locale: {
        getMany: vi.fn().mockResolvedValue({ items: [{ code: 'en-US', default: true }] }),
      },
    },
    ids: {
      app: 'test-app',
      environment: 'test-env',
      space: 'test-space',
    },
    location: {
      is: vi.fn(),
    },
    window: {
      startAutoResizer: vi.fn(),
      stopAutoResizer: vi.fn(),
      updateHeight: vi.fn(),
    },
  };

  return overrides ? { ...baseMockSdk, ...overrides } : baseMockSdk;
};

const mockSdk = createMockSdk();
const mockCma = mockSdk.cma;

export { createMockSdk, mockCma, mockSdk };
