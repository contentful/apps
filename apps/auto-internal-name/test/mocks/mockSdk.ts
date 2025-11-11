import { vi } from 'vitest';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  ids: {
    app: 'test-app',
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
};

export { mockSdk };
