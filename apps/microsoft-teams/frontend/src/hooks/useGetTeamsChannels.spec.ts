import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useGetTeamsChannels from './useGetTeamsChannels';
import { mockCma, mockSdk, mockChannels } from '@test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('useGetTeamsChannels', () => {
  it('should return list of microsoft teams channels', async () => {
    mockSdk.cma.appActionCall.createWithResponse = vi.fn().mockReturnValueOnce({
      response: {
        body: JSON.stringify({
          ok: true,
          data: mockChannels,
        }),
      },
    });
    const { result } = renderHook(() => useGetTeamsChannels());
    await waitFor(() => expect(result.current).toEqual(mockChannels));
  });
});
