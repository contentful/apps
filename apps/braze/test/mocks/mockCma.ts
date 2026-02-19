import { vi } from 'vitest';

const mockCma: any = {
  appActionCall: {
    createWithResponse: vi.fn(),
  },
  contentType: {
    get: vi.fn(),
    createWithId: vi.fn(),
    publish: vi.fn(),
    getMany: vi.fn(),
  },
  entry: {
    createWithId: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
  },
  editorInterface: {
    get: vi.fn(),
    update: vi.fn(),
  },
};

export { mockCma };
