export const sdk: any = {
  ids: {
    space: 'test-space',
    environment: 'master',
    user: '123'
  },
  app: {
    setReady: jest.fn(),
    isInstalled: jest.fn().mockReturnValue(Promise.resolve(false)),
    getParameters: jest.fn().mockReturnValue(Promise.resolve(null)),
    onConfigure: jest.fn()
  },
  space: {
    getContentTypes: jest.fn().mockReturnValue(Promise.resolve([])),
    getEditorInterfaces: jest.fn().mockResolvedValue({ items: [] })
  },
  notifier: {
    error: jest.fn()
  },
  window: {
    startAutoResizer: jest.fn()
  },
  field: {
    getValue: jest.fn().mockReturnValue('field-value'),
    setValue: jest.fn(),
    removeValue: jest.fn()
  },
  parameters: {
    installation: {
      workspaceId: 'mock-workspace-id',
      accessToken: 'mock-access-token'
    }
  }
};