import { vi } from 'vitest';

const mockCma = {
  contentType: {
    get: vi.fn(),
    createWithId: vi.fn(),
    publish: vi.fn(),
    getMany: vi.fn(),
    unpublish: vi.fn(),
    delete: vi.fn(),
  },
  entry: {
    get: vi.fn(),
    getMany: vi.fn(),
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
  locale: {
    getMany: vi.fn().mockResolvedValue({
      items: [
        { default: true, code: 'en-US' },
        { default: false, code: 'es-ES' },
      ],
    }),
  },
};

export { mockCma };
