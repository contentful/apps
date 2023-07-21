import { AppInstallationParameters } from '@locations/ConfigScreen';
import { vi } from 'vitest';

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
  };
};

export { createSDK };
