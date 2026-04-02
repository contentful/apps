import { vi } from 'vitest';

const mockCma = {
  contentType: {
    get: vi.fn(),
    getMany: vi.fn(),
  },
  appInstallation: {
    getForOrganization: vi.fn(),
  },
};

export { mockCma };
