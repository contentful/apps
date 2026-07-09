import { vi } from 'vitest';

// Default: classic space (no component types, some content types). Tests
// override componentType.getMany to simulate an ExO/empty space.
const mockCma: any = {
  componentType: {
    getMany: vi.fn().mockResolvedValue({ total: 0, items: [] }),
  },
  contentType: {
    getMany: vi.fn().mockResolvedValue({ total: 1, items: [] }),
  },
};

export { mockCma };
