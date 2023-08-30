import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useGetContentTypes from './useGetContentTypes';
import { mockCma, MockSdk, mockSdkParameters, mockContentTypes } from '../../../test/mocks';
import { ContentTypeAction } from '@components/config/contentTypeReducer';

const mockSdk = new MockSdk(mockSdkParameters.happyPath);
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
}));

describe('useGetContentTypes', () => {
  beforeEach(() => {
    mockSdk.reset();
  });

  it('should return content types dispatch selected content types', async () => {
    const dispatchMock = vi.fn((val) => val);

    const { result } = renderHook(() => useGetContentTypes(dispatchMock));
    await waitFor(() => expect(dispatchMock).toBeCalled());

    expect(dispatchMock).toHaveBeenCalledWith({
      type: ContentTypeAction.ADD_ALL,
      value: ['page'],
    });

    expect(result.current).toEqual(mockContentTypes.mockGetManyContentType.items);
  });
});
