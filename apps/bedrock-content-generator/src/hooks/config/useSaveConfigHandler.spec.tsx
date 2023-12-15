import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  generateRandomParameters,
  mockCma,
  MockSdk,
  mockSdkParameters,
  mockContentTypes,
} from '../../../test/mocks';
import useSaveConfigHandler from './useSaveConfigHandler';
import AppInstallationParameters from '@components/config/appInstallationParameters';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
}));

describe('useSaveConfigHandler', () => {
  beforeEach(() => {
    mockSdk.reset();
  });

  it('adds the on configure callback', async () => {
    const parameters = generateRandomParameters();
    const mockValidateParams = vi.fn().mockReturnValue([]);

    renderHook(() =>
      useSaveConfigHandler(
        parameters,
        mockValidateParams,
        mockContentTypes.mockSelectedContentTypes
      )
    );
    await waitFor(() => expect(sdk.app.onConfigure).toHaveBeenCalledOnce());

    const configureCallback = sdk.app.onConfigure.mock.calls[0][0];
    expect(configureCallback).toBeTypeOf('function');
  });

  it('updates the on configure callback when parameters change', async () => {
    const testCases = [
      generateRandomParameters(),
      generateRandomParameters(),
      mockSdkParameters.happyPath,
    ];
    const mockValidateParams = vi.fn().mockReturnValue([]);

    const testIfHookUpdates = async (parameterIndex: number) => {
      const parameters = testCases[parameterIndex];
      const currentTimesCalled = parameterIndex + 2;
      const onConfigureCallbackIndex = parameterIndex + 1;

      rerender(parameters);
      await waitFor(() => expect(sdk.app.onConfigure).toHaveBeenCalledTimes(currentTimesCalled));

      const configureCallback2 =
        await sdk.app.onConfigure.mock.calls[onConfigureCallbackIndex][0]();
      expect(configureCallback2.parameters).toEqual(parameters);
    };

    const { rerender } = renderHook(
      (props: AppInstallationParameters) =>
        useSaveConfigHandler(props, mockValidateParams, mockContentTypes.mockSelectedContentTypes),
      {
        initialProps: mockSdkParameters.init.installation,
      }
    );

    await waitFor(() => expect(sdk.app.onConfigure).toHaveBeenCalledOnce());

    for (let i = 0; i < testCases.length; i++) {
      await testIfHookUpdates(i);
    }
  });

  it('does not save the configuration when there are invalid parameters', async () => {
    const parameters = generateRandomParameters();
    const mockValidateParams = vi.fn().mockReturnValue(['invalid']);

    renderHook(() =>
      useSaveConfigHandler(
        parameters,
        mockValidateParams,
        mockContentTypes.mockSelectedContentTypes
      )
    );

    await waitFor(() => expect(sdk.app.onConfigure).toHaveBeenCalledOnce());

    const configureCallback = sdk.app.onConfigure.mock.calls[0][0]();
    expect(configureCallback.parameters).toEqual(undefined);
  });
});
