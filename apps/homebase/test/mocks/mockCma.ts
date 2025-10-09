import { vi } from 'vitest';

const mockCma: any = {
  contentType: {
    get: vi.fn(),
    createWithId: vi.fn(),
    publish: vi.fn(),
  },
  uiConfig: {
    get: vi.fn(),
    update: vi.fn(),
  },
};

export { mockCma };
