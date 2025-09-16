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
      result: {
        ok: true,
        channels: mockChannels,
      },
      status: 'processing',
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
      result: {
        body: JSON.stringify({
          ok: false,
          error: {
            type: 'Error',
            message: 'Failed to fetch Teams channels',
          },
        }),
      },
    });
    const { result } = renderHook(() => useGetTeamsChannels());
    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.error?.message).toEqual('Failed to fetch Teams channels');
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
