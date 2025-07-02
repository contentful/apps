import { vi } from 'vitest';

const mockCma = {
  contentType: {
    get: vi.fn(),
    createWithId: vi.fn(),
    publish: vi.fn(),
    getMany: vi.fn(),
  },
  entry: {
    get: vi.fn(),
    createWithId: vi.fn(),
  },
  editorInterface: {
    get: vi.fn(),
    update: vi.fn(),
  },
  appActionCall: {
    createWithResponse: vi.fn(),
  },
  asset: {
    get: vi.fn(),
  },
};

export { mockCma };
