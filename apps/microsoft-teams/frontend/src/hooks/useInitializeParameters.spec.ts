import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useInitializeParameters from './useInitializeParameters';
import { mockParameters, mockSdk } from '@test/mocks';
import { actions } from '@components/config/parameterReducer';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('useInitializeParameters', () => {
  it('should dispatch Contentful parameters and call setReady', async () => {
    const dispatchMock = vi.fn((val) => val);
    mockSdk.app.getParameters = vi.fn().mockReturnValueOnce(mockParameters);

    renderHook(() => useInitializeParameters(dispatchMock));
    await waitFor(() => expect(dispatchMock).toBeCalled());

    expect(dispatchMock).toHaveBeenCalledWith({
      type: actions.APPLY_CONTENTFUL_PARAMETERS,
      payload: mockParameters,
    });

    expect(mockSdk.app.setReady).toBeCalled();
  });

  it('should not dispatch anything if parameters are not present', async () => {
    const dispatchMock = vi.fn((val) => val);
    mockSdk.app.getParameters = vi.fn().mockReturnValueOnce(undefined);

    renderHook(() => useInitializeParameters(dispatchMock));
    await waitFor(() => expect(dispatchMock).not.toBeCalled());

    expect(dispatchMock).not.toBeCalled();
    expect(mockSdk.app.setReady).toBeCalled();
  });
});
