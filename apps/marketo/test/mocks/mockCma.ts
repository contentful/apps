import { vi } from 'vitest';

const mockCma: any = {
  contentType: {
    getMany: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  },
  appActionCall: {
    createWithResponse: vi.fn().mockResolvedValue({
      response: { body: JSON.stringify({ valid: true }) },
    }),
  },
};

export { mockCma };
