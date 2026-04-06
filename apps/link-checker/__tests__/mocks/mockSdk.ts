const mockSdk: any = {
  app: {
    onConfigure: jest.fn(),
    getParameters: jest.fn().mockReturnValueOnce({}),
    setReady: jest.fn(),
    getCurrentState: jest.fn(),
  },
  ids: {
    app: 'test-app',
    space: 'test-space',
    environment: 'test-env',
    organization: 'test-org',
  },
  parameters: {
    installation: {},
  },
  locales: {
    default: 'en-US',
  },
  entry: {
    fields: {},
  },
  navigator: {
    openEntry: jest.fn(),
    openAppConfig: jest.fn(),
  },
  cma: {},
  location: { is: jest.fn().mockReturnValue(false) },
};

export { mockSdk };
