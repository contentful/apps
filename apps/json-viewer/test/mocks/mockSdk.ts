const mockSdk: any = {
  app: {
    onConfigure: jest.fn(),
    getParameters: jest.fn().mockReturnValueOnce({}),
    setReady: jest.fn(),
    getCurrentState: jest.fn(),
  },
  ids: {
    app: 'test-app',
  },
  parameters: {
    installation: {
      displayDataTypes: 'true',
      iconStyle: {},
      collapsed: 'true',
      theme: {},
    },
    instance: {},
  },
  entry: {
    getSys: jest.fn().mockReturnValue({ id: 'test-id' }),
  },
};

export { mockSdk };
