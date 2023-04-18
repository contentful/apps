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
    user: 'user-id',
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
  contentType: {
    name: 'Category',
  },
};

export { mockSdk };
