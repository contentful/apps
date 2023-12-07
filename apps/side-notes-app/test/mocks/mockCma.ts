import { vi } from 'vitest';

const mockCma: any = {
  contentType: {
    getMany: vi.fn().mockReturnValue({
      sys: {},
      items: [],
    }),
  },
};

export { mockCma };
