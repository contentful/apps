import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useGetTeamsChannels from './useGetTeamsChannels';
import { mockCma, mockSdk, mockChannels } from '@test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('useGetTeamsChannels', () => {
  it('should return channels and accurate loading state', async () => {
    mockSdk.cma.appActionCall.createWithResult = vi.fn().mockReturnValueOnce({
      sys: {
        result: {
          ok: true,
          data: mockChannels,
        },
        status: 'succeeded',
      },
    });
    const { result } = renderHook(() => useGetTeamsChannels());
    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.channels).toEqual(mockChannels);
      expect(result.current.loading).toEqual(false);
    });
  });

  it('should return correct error if response is not ok', async () => {
    mockSdk.cma.appActionCall.createWithResult = vi.fn().mockReturnValueOnce({
      sys: {
        status: 'succeeded',
        result: {
          ok: false,
          error: {
            type: 'Error',
            message: 'This is an error',
          },
        },
      },
    });
    const { result } = renderHook(() => useGetTeamsChannels());
    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.error?.message).toEqual(
        'Failed to fetch Teams channels: This is an error'
      );
      expect(result.current.loading).toEqual(false);
    });
  });

  it('should return generalized error if error is thrown', async () => {
    mockSdk.cma.appActionCall.createWithResult = vi.fn().mockRejectedValueOnce(new Error());
    const { result } = renderHook(() => useGetTeamsChannels());
    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.error?.message).toEqual(
        'Unknown error occured. Please try again later.'
      );
      expect(result.current.loading).toEqual(false);
    });
  });
});
