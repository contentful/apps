import { vi } from 'vitest';

const mockCma: any = {
  contentType: {
    getMany: vi.fn(),
    get: vi.fn(),
  },
  entry: {
    getMany: vi.fn(),
    get: vi.fn(),
  },
  asset: {
    getMany: vi.fn(),
  },
};

export { mockCma };
