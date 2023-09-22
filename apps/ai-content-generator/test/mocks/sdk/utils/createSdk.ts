import { vi } from 'vitest';
import {
  mockGetManyContentType,
  mockEditorInterface,
  mockContentType,
} from '../contentTypes/mockContentType';
import { mockEntry } from '../entry/mockEntry';
import AppInstallationParameters from '@components/config/appInstallationParameters';

const createSDK = (parameters: AppInstallationParameters) => {
  return {
    app: {
      onConfigure: vi.fn(),
      getParameters: vi.fn().mockReturnValueOnce(parameters),
      setReady: vi.fn(),
      getCurrentState: vi.fn().mockReturnValue({ EditorInterface: mockEditorInterface }),
    },
    ids: {
      app: 'test-app',
    },
    notifier: {
      error: vi.fn(),
    },
    cma: {
      contentType: {
        getMany: vi.fn().mockReturnValueOnce(mockGetManyContentType),
        get: vi.fn().mockReturnValueOnce(mockContentType),
      },
      entry: {
        get: vi.fn().mockReturnValueOnce(mockEntry),
      },
    },
    hostnames: {
      webapp: '',
    },
    parameters: {
      installation: { ...parameters },
    },
  };
};

export { createSDK };
