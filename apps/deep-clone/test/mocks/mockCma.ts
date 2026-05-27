import { vi } from 'vitest';

const mockCma = {
  contentType: {
    get: vi.fn(),
    getMany: vi.fn(),
  },
  entry: {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
};

export { mockCma };
