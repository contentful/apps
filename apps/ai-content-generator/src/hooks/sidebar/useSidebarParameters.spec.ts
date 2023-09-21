import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useSidebarParameters from './useSidebarParameters';
import { mockCma, MockSdk, mockSdkParameters } from '../../../test/mocks';

const mockSdk = new MockSdk(mockSdkParameters.happyPath);
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
}));

describe('useSidebarParameters', () => {
  it('should return whether there is a brand profile and any errors', async () => {
    const { result } = renderHook(() => useSidebarParameters());

    await waitFor(() => {
      expect(result.current).toHaveProperty('hasBrandProfile', true);
      expect(result.current).toHaveProperty('apiError', undefined);
    });
  });
});
