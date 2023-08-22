import { AppInstallationParameters } from '@locations/ConfigScreen';
import { vi } from 'vitest';
import { mockGetManyContentType } from '../contentTypes/mockContentType';

const createSDK = (parameters: AppInstallationParameters) => {
  return {
    app: {
      onConfigure: vi.fn(),
      getParameters: vi.fn().mockReturnValueOnce(parameters),
      setReady: vi.fn(),
      getCurrentState: vi.fn(),
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
      },
    },
  };
};

export { createSDK };
