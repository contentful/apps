import { vi } from 'vitest';

const mockCma: any = {
  entry: {
    get: vi.fn().mockResolvedValue({ sys: { id: 'test-id' } }),
    references: vi.fn().mockResolvedValue({ items: [] }),
  },
};

export { mockCma };
