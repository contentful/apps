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
    },
    field: {
      getValue: vi.fn(),
      setValue: vi.fn(),
    },
    parameters: {
      installation: {},
    },
    cma: {
      appActionCall: {
        createWithResponse: vi.fn(),
      },
    },
    ids: {
      app: 'test-app',
      environment: 'test-env',
      space: 'test-space',
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

export { mockSdk, createMockSdk };
