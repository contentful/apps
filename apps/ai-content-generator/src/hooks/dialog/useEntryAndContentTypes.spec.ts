import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useEntryAndContentType from './useEntryAndContentType';
import {
  mockCma,
  MockSdk,
  mockSdkParameters,
  mockContentTypes,
  mockEntry,
} from '../../../test/mocks';

const mockSdk = new MockSdk(mockSdkParameters.happyPath);
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
}));

describe('useEntryAndContentType', () => {
  it('should return the entry, the content type for the entry, and updateEntry function', async () => {
    const { result } = renderHook(() => useEntryAndContentType('abc123'));

    await waitFor(() => {
      expect(result.current).toHaveProperty('entry', mockEntry);
      expect(result.current).toHaveProperty('contentType', mockContentTypes.mockContentType);
      expect(result.current).toHaveProperty('updateEntry');
    });
  });
});
