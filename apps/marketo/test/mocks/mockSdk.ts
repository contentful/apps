import { vi } from 'vitest';

const createMockSdk = (overrides?: Record<string, unknown>) => {
  const baseMockSdk = {
    app: {
      onConfigure: vi.fn(),
      getParameters: vi.fn().mockReturnValueOnce({}),
      setReady: vi.fn(),
      getCurrentState: vi.fn(),
    },
    field: {
      getValue: vi.fn(),
      setValue: vi.fn(),
    },
    parameters: {
      installation: {},
    },
    ids: {
      app: 'test-app',
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
