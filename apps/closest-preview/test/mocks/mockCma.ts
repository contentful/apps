import { vi } from 'vitest';

const mockCma: any = {
  contentType: {
    getMany: vi.fn().mockResolvedValue({ items: [] }),
  },
  editorInterface: {
    getMany: vi.fn().mockResolvedValue({ items: [] }),
  },
};

export { mockCma };
