import { vi } from 'vitest';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockResolvedValue(null),
    setReady: vi.fn(),
    getCurrentState: vi.fn().mockResolvedValue({}),
  },
  ids: {
    app: 'test-app',
    space: 'test-space',
    environment: 'test-environment',
  },
  cma: {
    contentType: {
      getMany: vi.fn(),
    },
  },
  field: {
    getValue: vi.fn().mockReturnValue(''),
    setValue: vi.fn().mockResolvedValue(undefined),
    onValueChanged: vi.fn(),
    removeValue: vi.fn(),
  },
  locales: {
    default: 'en-US',
    available: ['en-US', 'es-ES'],
  },
  notifier: {
    error: vi.fn(),
  },
};

export { mockSdk };
