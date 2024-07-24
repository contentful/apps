import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useGetContentTypes } from './useGetContentTypes';
import { mockCma, mockSdk, mockGetManyContentType } from '@test/mocks';

vi.mock('@constants/contentTypeLimit', () => ({
  CONTENT_TYPE_LIMIT: 1,
}));

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('useGetContentTypes', () => {
  it('should return content types', async () => {
    mockSdk.cma.contentType.getMany = vi.fn().mockReturnValueOnce(mockGetManyContentType);
    const { result } = renderHook(() => useGetContentTypes());
    await waitFor(() => {
      expect(result.current.contentTypes).toEqual(mockGetManyContentType.items);
      expect(result.current.loading).toEqual(false);
    });

    vi.restoreAllMocks();
  });

  it('should return generalized error if error is thrown', async () => {
    mockSdk.cma.appActionCall.createWithResponse = vi.fn().mockRejectedValueOnce(new Error());
    const { result } = renderHook(() => useGetContentTypes());
    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.error?.message).toEqual('Unable to get content types');
      expect(result.current.loading).toEqual(false);
    });

    vi.restoreAllMocks();
  });

  it('batches requests if the number of available content types exceeds the request limit', async () => {
    const getManyResponse = { ...mockGetManyContentType, total: 2 };
    getManyResponse.total = 2;
    const getManySpy = (mockSdk.cma.contentType.getMany = vi.fn().mockReturnValue(getManyResponse));

    renderHook(() => useGetContentTypes());

    await waitFor(() => {
      expect(getManySpy).toHaveBeenCalledTimes(2);
    });

    vi.restoreAllMocks();
  });
});
