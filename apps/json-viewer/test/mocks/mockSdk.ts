import { vi } from 'vitest';

const parameters = {
  installation: {
    displayDataTypes: 'true',
    iconStyle: {},
    collapsed: 'true',
    theme: {},
  },
  instance: {},
  configOptions: {},
};

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce(parameters),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
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
