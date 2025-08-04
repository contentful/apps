import { vi } from 'vitest';

const mockCma: any = {
  contentType: {
    getMany: vi.fn().mockResolvedValue({
      items: [],
      total: 0,
    }),
  },
};

export { mockCma };
