import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateRandomInvocationParameters, MockSdk } from '../../../test/mocks';
import useEntryAndContentType from './useEntryAndContentType';

const invocationParameters = generateRandomInvocationParameters();
const mockSdk = new MockSdk({ invocation: invocationParameters });
const sdk = mockSdk.sdk;
const cma = sdk.cma;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => cma,
}));

describe('useEntryAndContentType', () => {
  beforeEach(() => {
    mockSdk.reset();
  });

  const expectToBeNull = (result: ReturnType<typeof useEntryAndContentType>) => {
    expect(result.entry).toBeNull();
    expect(result.contentType).toBeNull();
  };

  it('should output the entry and content type', async () => {
    const { result } = renderHook((entryId) => useEntryAndContentType(entryId), {
      initialProps: sdk.parameters.invocation!.entryId,
    });

    await waitFor(() => {
      expect(result.current.entry).not.toBeNull();
    });

    expect(result.current.contentType).not.toBeNull();
  });

  it('should handle the cma request failing on entry', async () => {
    cma.entry.get = vi.fn((entryId) => entryId).mockRejectedValueOnce(new Error('error'));
    const { result } = renderHook((entryId) => useEntryAndContentType(entryId), {
      initialProps: sdk.parameters.invocation!.entryId,
    });

    await waitFor(() => expectToBeNull(result.current));
  });

  it('should handle the cma request failing on content type', async () => {
    cma.contentType.get = vi.fn((entryId) => entryId).mockRejectedValueOnce(new Error('error'));
    const { result } = renderHook((entryId) => useEntryAndContentType(entryId), {
      initialProps: sdk.parameters.invocation!.entryId,
    });

    await waitFor(() => expectToBeNull(result.current));
  });

  it('should display null when no entry id', async () => {
    const { result, rerender } = renderHook((entryId) => useEntryAndContentType(entryId), {
      initialProps: '',
    });

    expectToBeNull(result.current);

    rerender('');
    await waitFor(() => expectToBeNull(result.current));
  });
});
