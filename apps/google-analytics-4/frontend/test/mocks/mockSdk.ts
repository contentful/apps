const mockSdk: any = {
  app: {
    onConfigure: jest.fn(),
    getParameters: jest.fn().mockReturnValueOnce({}),
    setReady: jest.fn(),
    getCurrentState: jest.fn(),
    isInstalled: jest.fn(),
    onConfigurationCompleted: jest.fn(),
  },
  ids: {
    app: 'test-app',
  },
  notifier: {
    error: jest.fn(),
  },
  parameters: {
    installation: {},
    instance: {},
  },
  location: {
    is: jest.fn().mockReturnValue(true),
  },
};

export { mockSdk };
