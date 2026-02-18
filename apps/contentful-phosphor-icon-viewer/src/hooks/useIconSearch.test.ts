import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIconSearch } from './useIconSearch';
import { mockIconCatalog } from '../test/mocks/mockIcons';

describe('useIconSearch', () => {
  it('returns all icons when query is empty', () => {
    const { result } = renderHook(() => useIconSearch({ catalog: mockIconCatalog }));

    expect(result.current.results).toEqual(mockIconCatalog);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.query).toBe('');
  });

  it('returns all icons when query is below minSearchLength', () => {
    const { result } = renderHook(() =>
      useIconSearch({ catalog: mockIconCatalog, minSearchLength: 3 })
    );

    act(() => {
      result.current.setQuery('ab');
    });

    expect(result.current.results).toEqual(mockIconCatalog);
    expect(result.current.isSearching).toBe(false);
  });

  it('filters icons based on name search', () => {
    const { result } = renderHook(() => useIconSearch({ catalog: mockIconCatalog }));

    act(() => {
      result.current.setQuery('airplane');
    });

    expect(result.current.isSearching).toBe(true);
    expect(result.current.results.length).toBeGreaterThan(0);
    expect(result.current.results.some((icon) => icon.name.includes('airplane'))).toBe(true);
  });

  it('filters icons based on tag search', () => {
    const { result } = renderHook(() => useIconSearch({ catalog: mockIconCatalog }));

    act(() => {
      result.current.setQuery('notification');
    });

    expect(result.current.isSearching).toBe(true);
    // "bell" has the "notification" tag
    expect(result.current.results.some((icon) => icon.name === 'bell')).toBe(true);
  });

  it('returns empty array when no matches found', () => {
    const { result } = renderHook(() => useIconSearch({ catalog: mockIconCatalog }));

    act(() => {
      result.current.setQuery('xyznonexistent');
    });

    expect(result.current.isSearching).toBe(true);
    expect(result.current.results.length).toBe(0);
  });

  it('performs fuzzy matching', () => {
    const { result } = renderHook(() => useIconSearch({ catalog: mockIconCatalog }));

    act(() => {
      result.current.setQuery('airplne'); // typo in "airplane"
    });

    expect(result.current.isSearching).toBe(true);
    // Fuzzy matching should still find airplane icons
    expect(result.current.results.some((icon) => icon.name.includes('airplane'))).toBe(true);
  });

  it('updates query state correctly', () => {
    const { result } = renderHook(() => useIconSearch({ catalog: mockIconCatalog }));

    act(() => {
      result.current.setQuery('test');
    });

    expect(result.current.query).toBe('test');

    act(() => {
      result.current.setQuery('');
    });

    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual(mockIconCatalog);
  });
});
