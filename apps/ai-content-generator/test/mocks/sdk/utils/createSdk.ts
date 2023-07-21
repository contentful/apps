import { AppInstallationParameters } from '@locations/ConfigScreen';
import { DialogInvocationParameters } from '@locations/Dialog';
import type { MockCma } from '@test/mocks/cma/mockCma';
import { vi } from 'vitest';

interface SdkParameters {
  parameters: AppInstallationParameters;
  invocation?: DialogInvocationParameters;
}

const createSDK = (data: SdkParameters, cma: MockCma['cma']) => {
  const { parameters, invocation } = data;

  return {
    app: {
      onConfigure: vi.fn(),
      getParameters: vi.fn().mockReturnValueOnce({ parameters }),
      setReady: vi.fn(),
      getCurrentState: vi.fn(),
    },
    cma,
    parameters: {
      invocation: invocation,
      installation: parameters,
    },
    ids: {
      app: 'test-app',
    },
  };
};

export { createSDK };
export type { SdkParameters };
