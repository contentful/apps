import { vi } from 'vitest';
import { mockContentTypes } from './mockContentTypes';

export const makeSdkMock = () => ({
  ids: {
    app: 'some-app',
  },
  hostnames: {
    webapp: 'app.contentful.com',
  },
  space: {
    getContentTypes: vi.fn().mockResolvedValue({ items: mockContentTypes }),
    getEditorInterfaces: vi.fn().mockResolvedValue({ items: [] }),
  },
  app: {
    setReady: vi.fn(),
    getParameters: vi.fn().mockResolvedValue(null),
    onConfigure: vi.fn().mockReturnValue(undefined),
  },
  notifier: {
    error: (msg: string) => console.log(`[mockSdk] error: ${msg}`),
  },
});
