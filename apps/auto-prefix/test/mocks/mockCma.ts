import { vi } from 'vitest';

const createMockCma = () => {
  return {
    entry: {
      getMany: vi.fn().mockResolvedValue({
        items: [],
        total: 0,
      }),
      get: vi.fn(),
    },
    contentType: {
      getMany: vi.fn(),
    },
    appInstallation: {
      getForOrganization: vi.fn(),
    },
  };
};

const mockCma = createMockCma();

export { mockCma, createMockCma };
