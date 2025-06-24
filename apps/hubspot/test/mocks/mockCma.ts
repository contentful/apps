import { vi } from 'vitest';

const mockCma = {
  contentType: {
    get: vi.fn(),
    createWithId: vi.fn(),
    publish: vi.fn(),
    getMany: vi.fn(),
  },
  entry: {
    createWithId: vi.fn(),
  },
  editorInterface: {
    get: vi.fn(),
    update: vi.fn(),
  },
};

export { mockCma };
