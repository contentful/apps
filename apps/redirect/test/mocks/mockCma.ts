import { vi } from 'vitest';

const mockCma: any = {
  contentType: {
    getMany: vi.fn().mockResolvedValue({ items: [] }),
    get: vi.fn(),
    createWithId: vi.fn().mockResolvedValue({ sys: { id: 'test', version: 1 } }),
    publish: vi.fn().mockResolvedValue({}),
  },
};

export { mockCma };
