import { mockContentTypes } from './mockContentTypes';

export const makeSdkMock = () => ({
  ids: {
    app: 'some-app',
  },
  hostnames: {
    webapp: 'app.contentful.com',
  },
  space: {
    getContentTypes: jest.fn().mockResolvedValue({ items: mockContentTypes }),
    getEditorInterfaces: jest.fn().mockResolvedValue({ items: [] }),
  },
  app: {
    setReady: jest.fn(),
    getParameters: jest.fn().mockResolvedValue(null),
    onConfigure: jest.fn().mockReturnValue(undefined),
  },
  notifier: {
    error: (msg: string) => console.log(`[mockSdk] error: ${msg}`),
  },
});
