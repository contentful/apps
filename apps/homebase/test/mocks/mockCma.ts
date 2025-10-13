import { vi } from 'vitest';

const mockCma: any = {
  contentType: {
    get: vi.fn(),
    createWithId: vi.fn(),
    publish: vi.fn(),
  },
  uiConfig: {
    get: vi.fn(),
    update: vi.fn(),
  },
  entry: {
    get: vi.fn(),
    getMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    publish: vi.fn(),
    unpublish: vi.fn(),
  },
};

export { mockCma };
