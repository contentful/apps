import { vi } from 'vitest';

const mockSdk: any = {
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
};

export { mockSdk };
