export const mockSdk = {
  app: {
    onConfigure: jest.fn(),
    getParameters: jest.fn().mockReturnValueOnce({}),
    setReady: jest.fn(),
    getCurrentState: jest.fn(),
  },
  window: {
    startAutoResizer: jest.fn(),
  },
  parameters: {
    installation: {
      excludedProject: [],
      apiBearerToken: '',
    },
  },
  field: {
    getValue: jest.fn(),
  },
};
