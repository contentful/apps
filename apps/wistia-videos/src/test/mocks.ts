import { vi } from 'vitest';

export const mockSdk = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  window: {
    startAutoResizer: vi.fn(),
  },
  parameters: {
    installation: {
      excludedProject: [],
      apiBearerToken: '',
    },
  },
  field: {
    getValue: vi.fn(),
  },
};
