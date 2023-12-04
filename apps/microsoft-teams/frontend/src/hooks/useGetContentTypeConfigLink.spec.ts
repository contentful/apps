import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useGetContentTypeConfigLink from './useGetContentTypeConfigLink';
import { mockCma, mockSdk } from '@test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('useGetContentTypeConfigLink', () => {
  it('should return a link for the master environment', () => {
    const { result } = renderHook(() => useGetContentTypeConfigLink());

    expect(result.current).toEqual(
      `https://${mockSdk.hostnames.webapp}/spaces/${mockSdk.ids.space}/content_types`
    );
  });
  it('should return a link for a non-master environment', () => {
    mockSdk.ids.environment = vi.fn().mockReturnValueOnce('testing');
    const { result } = renderHook(() => useGetContentTypeConfigLink());

    expect(result.current).toEqual(
      `https://${mockSdk.hostnames.webapp}/spaces/${mockSdk.ids.space}/environments/${mockSdk.ids.environment}/content_types`
    );
  });
});
