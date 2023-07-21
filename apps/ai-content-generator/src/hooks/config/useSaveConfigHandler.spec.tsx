import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  generateRandomInstallationParameters,
  mockInstallationParameters,
  MockSdk,
} from '../../../test/mocks';
import useSaveConfigHandler from './useSaveConfigHandler';
import { AppInstallationParameters } from '@locations/ConfigScreen';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;
const cma = sdk.cma;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => cma,
}));

describe('useSaveConfigHandler', () => {
  beforeEach(() => {
    mockSdk.reset();
  });

  it('adds the on configure callback', async () => {
    const parameters = generateRandomInstallationParameters();

    renderHook(() => useSaveConfigHandler(parameters));
    await waitFor(() => expect(sdk.app.onConfigure).toHaveBeenCalledOnce());

    const configureCallback = sdk.app.onConfigure.mock.calls[0][0];
    expect(configureCallback).toBeTypeOf('function');
  });

  it('updates the on configure callback when parameters change', async () => {
    const testCases = [
      generateRandomInstallationParameters(),
      generateRandomInstallationParameters(),
      mockInstallationParameters.happyPath,
    ];

    const testIfHookUpdates = async (parameterIndex: number) => {
      const parameters = testCases[parameterIndex];
      const currentTimesCalled = parameterIndex + 2;
      const onConfigureCallbackIndex = parameterIndex + 1;

      rerender(parameters);
      await waitFor(() => expect(sdk.app.onConfigure).toHaveBeenCalledTimes(currentTimesCalled));

      const configureCallback2 = await sdk.app.onConfigure.mock.calls[
        onConfigureCallbackIndex
      ][0]();
      expect(configureCallback2.parameters).toEqual(parameters);
    };

    const { rerender } = renderHook(
      (props: AppInstallationParameters) => useSaveConfigHandler(props),
      {
        initialProps: mockInstallationParameters.init,
      }
    );

    await waitFor(() => expect(sdk.app.onConfigure).toHaveBeenCalledOnce());

    for (let i = 0; i < testCases.length; i++) {
      await testIfHookUpdates(i);
    }
  });
});
