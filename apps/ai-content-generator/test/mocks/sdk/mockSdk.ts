import { AppInstallationParameters } from '@locations/ConfigScreen';
import { mockSdkParameters } from '..';
import { createSDK } from './utils/createSdk';
import { vi } from 'vitest';
import {
  mockGetManyContentType,
  mockEditorInterface,
  mockContentType,
} from './contentTypes/mockContentType';
import { mockEntry } from './entry/mockEntry';

interface MockSdk {
  sdk: ReturnType<typeof createSDK>;
  originalData: {
    parameters: AppInstallationParameters;
  };
}

class MockSdk {
  constructor(parameters?: AppInstallationParameters) {
    const newParameters = parameters || mockSdkParameters.init;

    this.sdk = createSDK(newParameters);
    this.originalData = {
      parameters: newParameters,
    };
  }

  reset() {
    this.sdk.app.onConfigure = vi.fn();
    this.sdk.app.getParameters = vi.fn().mockReturnValueOnce(this.originalData.parameters);
    this.sdk.app.setReady = vi.fn();
    this.sdk.app.getCurrentState = vi
      .fn()
      .mockReturnValue({ EditorInterface: mockEditorInterface });
    this.sdk.notifier.error = vi.fn();
    this.sdk.cma.contentType.getMany = vi.fn().mockReturnValue(mockGetManyContentType);
    this.sdk.cma.contentType.get = vi.fn().mockReturnValue(mockContentType);
    this.sdk.cma.entry.get = vi.fn().mockReturnValue(mockEntry);
  }
}

export { MockSdk };
