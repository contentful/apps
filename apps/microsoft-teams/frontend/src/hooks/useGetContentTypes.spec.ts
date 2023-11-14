import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useGetContentTypes from './useGetContentTypes';
import { mockCma, mockSdk, mockGetManyContentType } from '@test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('useGetContentTypes', () => {
  it('should return content types', async () => {
    mockSdk.cma.contentType.getMany = vi.fn().mockReturnValueOnce(mockGetManyContentType);
    const { result } = renderHook(() => useGetContentTypes());
    await waitFor(() => expect(result.current).toEqual(mockGetManyContentType.items));
  });
});
