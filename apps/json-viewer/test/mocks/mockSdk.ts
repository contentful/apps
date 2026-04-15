import { vi } from 'vitest';

const parameters = {
  installation: {
    configOptions: {
      displayDataTypes: 'true',
      iconStyle: 'triangle',
      collapsed: 'true',
      theme: 'rjv-default',
      defaultIncludeDepth: '0',
    },
  },
  instance: {},
  configOptions: {},
};

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockResolvedValue(parameters),
    setReady: vi.fn(),
    getCurrentState: vi.fn().mockResolvedValue({}),
  },
  ids: {
    app: 'test-app',
  },
  parameters,
  entry: {
    getSys: vi.fn().mockReturnValue({ id: 'test-id' }),
  },
};

export { mockSdk };
