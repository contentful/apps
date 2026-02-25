import { vi } from 'vitest';
import { mockCma } from './mockCma';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn().mockImplementation((callback: () => Promise<any>) => {
      mockSdk.app.onConfigureCallback = callback;
    }),
    getParameters: vi.fn().mockResolvedValue({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn().mockResolvedValue({}),
    onConfigureCallback: null as (() => Promise<any>) | null,
  },
  ids: {
    app: 'test-app',
    space: 'test-space',
    environment: 'test-environment',
  },
  cma: mockCma,
  notifier: {
    error: vi.fn(),
  },
  parameters: {
    invocation: {
      entryId: 'test-entry',
      contentTypeId: 'test-content-type',
    },
  },
  dialogs: {
    openCurrentApp: vi.fn(),
  },
  locales: {
    default: 'en-US',
    available: vi.fn(),
    names: {
      'en-US': 'English (United States)',
      de: 'German',
      fr: 'French',
      'es-ES': 'Spanish (Spain)',
    },
  },
  entry: {
    getSys: vi.fn().mockReturnValue({
      id: 'test-entry',
    }),
  },
  contentType: {
    sys: {
      id: 'test-content-type',
    },
  },
  hostnames: {
    webapp: 'app.contentful.com',
  },
  close: vi.fn(),
};

export { mockSdk };
