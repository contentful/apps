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
    installation: {},
    instance: {},
  },
  field: {
    getValue: jest.fn(),
    setValue: jest.fn(),
    type: 'Object',
    onSchemaErrorsChanged: jest.fn(),
    onIsDisabledChanged: jest.fn(),
    onValueChanged: jest.fn(),
    removeValue: jest.fn(),
  },
  location: {
    is: jest.fn(),
  },
};

export { mockSdk };
