import { SdkParameters, createSDK } from './utils/createSdk';
import { vi } from 'vitest';
import { MockCma, mockInstallationParameters } from '@test/mocks';

interface MockSdk {
  sdk: ReturnType<typeof createSDK>;
  originalData: SdkParameters;
  mockCma: MockCma;
}

class MockSdk {
  constructor(initData?: Partial<SdkParameters>) {
    const parameters = initData?.parameters || mockInstallationParameters.init;
    const invocation = initData?.invocation;
    this.originalData = {
      parameters,
      invocation,
    };
    this.mockCma = new MockCma();

    this.sdk = createSDK({ parameters, invocation }, this.mockCma.cma);
  }

  reset() {
    this.sdk.app.onConfigure = vi.fn();
    this.sdk.app.getParameters = vi.fn().mockReturnValueOnce(this.originalData.parameters);
    this.sdk.app.setReady = vi.fn();
    this.sdk.app.getCurrentState = vi.fn();

    this.sdk.parameters = {
      invocation: this.originalData.invocation,
      installation: this.originalData.parameters,
    };

    this.mockCma.reset();
  }
}

export { MockSdk };
