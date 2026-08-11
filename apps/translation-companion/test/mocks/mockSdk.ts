import { vi } from 'vitest';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getCurrentState: vi.fn().mockResolvedValue({}),
    setReady: vi.fn(),
  },
};

export { mockSdk };
