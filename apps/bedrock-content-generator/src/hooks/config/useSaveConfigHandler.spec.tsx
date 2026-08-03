import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockCma, MockSdk, mockContentTypes } from '../../../test/mocks';
import useSaveConfigHandler from './useSaveConfigHandler';
import { PersistedInstallationParameters } from '@components/config/appInstallationParameters';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
}));

const generateTestParams = (): PersistedInstallationParameters => ({
  model: 'meta.llama2-70b-v1',
  profile: Math.random().toString(36).substring(7),
  region: 'us-east-1',
  accessKeyId: 'AKIAAAAAAAAAAAAAAAAA',
  secretAccessKey: '1234',
});

const initParams: PersistedInstallationParameters = {
  model: '',
  profile: '',
  region: '',
};

describe('useSaveConfigHandler', () => {
  beforeEach(() => {
    mockSdk.reset();
  });

  it('adds the on configure callback', async () => {
    const parameters = generateTestParams();
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
    const testCases = [generateTestParams(), generateTestParams(), generateTestParams()];
    const mockValidateParams = vi.fn().mockReturnValue([]);

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
      (props: PersistedInstallationParameters) =>
        useSaveConfigHandler(props, mockValidateParams, mockContentTypes.mockSelectedContentTypes),
      {
        initialProps: initParams,
      }
    );

    await waitFor(() => expect(sdk.app.onConfigure).toHaveBeenCalledOnce());

    for (let i = 0; i < testCases.length; i++) {
      await testIfHookUpdates(i);
    }
  });

  it('does not save the configuration when there are invalid parameters', async () => {
    const parameters = generateTestParams();
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
