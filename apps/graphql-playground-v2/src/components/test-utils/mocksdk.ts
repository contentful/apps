const mockSdk: any = {
  window: {
    // updateHeight: jest.fn().mockReturnValue(null),
    startAutoResizer: jest.fn(),
  },
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
    space: 'test-space',
  },
};

export { mockSdk };
