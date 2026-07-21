import { vi } from 'vitest';

export const createMockCMA = () => {
  return {
    asset: {
      create: vi.fn(),
      processForAllLocales: vi.fn(),
      get: vi.fn(),
      publish: vi.fn(),
    },
    entry: {
      create: vi.fn(),
    },
    contentType: {
      getMany: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    },
    space: {
      get: vi.fn().mockResolvedValue({ sys: { id: 'test-space-id' } }),
    },
    environment: {
      get: vi.fn().mockResolvedValue({ sys: { id: 'test-environment-id' } }),
    },
    appAction: {
      getManyForEnvironment: vi.fn().mockResolvedValue({ items: [] }),
    },
    agent: {
      generate: vi.fn(),
    },
    agentRun: {
      get: vi.fn(),
      resume: vi.fn(),
    },
  };
};

const mockCma: any = createMockCMA();

export { mockCma };
