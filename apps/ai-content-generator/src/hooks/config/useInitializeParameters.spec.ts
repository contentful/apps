import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useInitializeParameters from './useInitializeParameters';
import { mockCma, MockSdk, mockSdkParameters } from '../../../test/mocks';
import { ParameterAction } from '@components/config/parameterReducer';

const mockSdk = new MockSdk(mockSdkParameters.happyPath);
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
}));

describe('useInitializeParameters', () => {
  beforeEach(() => {
    mockSdk.reset();
  });

  it('should dispatch Contentful parameters and call setReady', async () => {
    const dispatchMock = vi.fn((val) => val);

    renderHook(() => useInitializeParameters(dispatchMock));
    await waitFor(() => expect(dispatchMock).toBeCalled());

    expect(dispatchMock).toHaveBeenCalledWith({
      type: ParameterAction.APPLY_CONTENTFUL_PARAMETERS,
      value: mockSdkParameters.happyPath,
    });

    expect(sdk.app.setReady).toBeCalled();
  });

  it('should not dispatch anything if parameters are not present', async () => {
    const dispatchMock = vi.fn((val) => val);
    sdk.app.getParameters = vi.fn().mockReturnValueOnce(undefined);

    renderHook(() => useInitializeParameters(dispatchMock));
    await waitFor(() => expect(dispatchMock).not.toBeCalled());

    expect(dispatchMock).not.toBeCalled();
    expect(sdk.app.setReady).not.toBeCalled();
  });
});
