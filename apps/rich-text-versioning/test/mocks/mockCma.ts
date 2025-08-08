import { vi } from 'vitest';

const mockCma: any = {
  contentType: {
    getMany: vi.fn(),
    get: vi.fn(),
  },
};

export { mockCma };
