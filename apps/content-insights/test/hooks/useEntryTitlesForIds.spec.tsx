import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { EntryProps } from 'contentful-management';
import { mockSdk } from '../mocks';
import { useEntryTitlesForIds } from '../../src/hooks/useEntryTitlesForIds';
import { fetchEntryTitlesForIds } from '../../src/utils/fetchEntryTitlesForIds';
import { createQueryProviderWrapper } from '../utils/createQueryProviderWrapper';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

vi.mock('../../src/utils/fetchEntryTitlesForIds');

const buildEntry = (id: string, title: string): EntryProps =>
  ({
    sys: { id, type: 'Entry', contentType: { sys: { id: 'blogPost' } } } as any,
    fields: { title: { 'en-US': title } },
  } as EntryProps);

describe('useEntryTitlesForIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an empty map and does not fetch when ids is empty', async () => {
    const { result } = renderHook(() => useEntryTitlesForIds([]), {
      wrapper: createQueryProviderWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(result.current.titlesMap.size).toBe(0);
    expect(result.current.error).toBeNull();
    expect(fetchEntryTitlesForIds).not.toHaveBeenCalled();
  });

  it('builds a map keyed by entry id from the fetched entries', async () => {
    const entries = [buildEntry('a', 'Alpha'), buildEntry('b', 'Beta')];
    vi.mocked(fetchEntryTitlesForIds).mockResolvedValue(entries);

    const { result } = renderHook(() => useEntryTitlesForIds(['a', 'b']), {
      wrapper: createQueryProviderWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(result.current.titlesMap.size).toBe(2);
    expect(result.current.titlesMap.get('a')).toEqual(entries[0]);
    expect(result.current.titlesMap.get('b')).toEqual(entries[1]);
    expect(fetchEntryTitlesForIds).toHaveBeenCalledWith(mockSdk, ['a', 'b']);
  });

  it('passes the original (unsorted) ids through to the fetch util', async () => {
    vi.mocked(fetchEntryTitlesForIds).mockResolvedValue([buildEntry('a', 'Alpha')]);

    const { result } = renderHook(() => useEntryTitlesForIds(['b', 'a']), {
      wrapper: createQueryProviderWrapper(),
    });

    await waitFor(() => expect(result.current.isFetching).toBe(false));

    // The hook sorts ids only for the query key (cache identity); the
    // CMA call itself receives the caller's order unchanged.
    expect(fetchEntryTitlesForIds).toHaveBeenCalledWith(mockSdk, ['b', 'a']);
  });

  it('exposes errors from the fetch util', async () => {
    const fetchError = new Error('boom');
    vi.mocked(fetchEntryTitlesForIds).mockRejectedValue(fetchError);

    const { result } = renderHook(() => useEntryTitlesForIds(['a']), {
      wrapper: createQueryProviderWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(result.current.error).toEqual(fetchError);
    expect(result.current.titlesMap.size).toBe(0);
  });
});
