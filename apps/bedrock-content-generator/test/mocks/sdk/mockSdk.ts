import { mockSdkParameters } from '..';
import { createSDK } from './utils/createSdk';
import { vi } from 'vitest';
import {
  mockGetManyContentType,
  mockEditorInterface,
  mockContentType,
} from './contentTypes/mockContentType';
import { mockEntry } from './entry/mockEntry';
import AppInstallationParameters from '@components/config/appInstallationParameters';
import { DialogInvocationParameters } from '@locations/Dialog';

class MockSdk {
  sdk: ReturnType<typeof createSDK>;
  originalData: {
    installation: AppInstallationParameters;
    invocation: DialogInvocationParameters | undefined;
  };

  constructor(parameters?: {
    installation?: AppInstallationParameters;
    invocation?: DialogInvocationParameters;
  }) {
    const mockParameters = mockSdkParameters.init;
    const newInstallationParameters = parameters?.installation || mockParameters.installation;
    const newInvocationParameters = parameters?.invocation || mockParameters.invocation;

    this.sdk = createSDK({
      installation: newInstallationParameters,
      invocation: newInvocationParameters,
    });
    this.originalData = {
      installation: newInstallationParameters,
      invocation: newInvocationParameters,
    };
  }

  reset() {
    this.sdk.app.onConfigure = vi.fn();
    this.sdk.app.getParameters = vi.fn().mockReturnValueOnce(this.originalData.installation);
    this.sdk.parameters.installation = this.originalData.installation;
    if (this.originalData.invocation) {
      this.sdk.parameters.invocation = this.originalData.invocation;
    }
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
