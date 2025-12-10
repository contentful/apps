import { vi } from 'vitest';

const mockCma = {
  contentType: {
    get: vi.fn(),
    getMany: vi.fn(),
  },
  entry: {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  appInstallation: {
    getForOrganization: vi.fn().mockReturnValue({
      items: [
        {
          sys: { space: { sys: { id: 'test-space' } } },
        },
      ],
    }),
  },
};

export { mockCma };
