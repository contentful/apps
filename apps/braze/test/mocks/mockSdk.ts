import { vi } from 'vitest';
import { BRAZE_ENDPOINTS_LIST } from '../../src/utils';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  ids: {
    entry: 'testEntryId',
    app: 'test-app',
    spaceId: 'test-spaceId',
  },
  dialogs: {
    openCurrentApp: vi.fn(),
  },
  parameters: {
    installation: {
      contentfulApiKey: 'test-contentful-apiKey',
      brazeApiKey: 'test-braze-apiKey',
      brazeEndpoint: BRAZE_ENDPOINTS_LIST[0],
      brazeConnectedFields: JSON.stringify({
        testEntryId: [
          ['fieldA', 'brazeIdA'],
          ['fieldB', 'brazeIdB'],
        ],
        testEntryId2: [['fieldC', 'brazeIdC']],
      }),
    },
    invocation: {
      id: 'test-entryId',
      contentTypeId: 'test-contentTypeId',
    },
  },
  locales: {
    default: 'en-US',
    available: ['en-US', 'es-AR'],
  },
  entry: {
    fields: {
      name: {
        getValue: vi.fn().mockReturnValue('Title'),
      },
    },
  },
  contentType: {
    displayField: 'name',
  },
  notifier: {
    error: vi.fn(),
  },
  hostnames: {
    delivery: 'cdn.contentful.com',
  },
  navigator: {
    openCurrentAppPage: vi.fn(),
    openAppConfig: vi.fn(),
  },
};

export { mockSdk };
