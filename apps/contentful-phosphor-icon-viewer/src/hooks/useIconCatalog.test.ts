import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIconCatalog } from './useIconCatalog';

describe('useIconCatalog', () => {
  it('returns an array of icon catalog entries', () => {
    const { result } = renderHook(() => useIconCatalog());

    expect(Array.isArray(result.current)).toBe(true);
    expect(result.current.length).toBeGreaterThan(0);
  });

  it('returns entries with correct structure', () => {
    const { result } = renderHook(() => useIconCatalog());
    const firstIcon = result.current[0];

    expect(firstIcon).toHaveProperty('name');
    expect(firstIcon).toHaveProperty('componentName');
    expect(firstIcon).toHaveProperty('tags');
    expect(firstIcon).toHaveProperty('categories');
    expect(typeof firstIcon.name).toBe('string');
    expect(typeof firstIcon.componentName).toBe('string');
    expect(Array.isArray(firstIcon.tags)).toBe(true);
    expect(Array.isArray(firstIcon.categories)).toBe(true);
  });

  it('filters out special tags starting with *', () => {
    const { result } = renderHook(() => useIconCatalog());

    // Check that no tags start with *
    result.current.forEach((icon) => {
      icon.tags.forEach((tag) => {
        expect(tag.startsWith('*')).toBe(false);
      });
    });
  });

  it('returns stable reference on re-render', () => {
    const { result, rerender } = renderHook(() => useIconCatalog());
    const firstResult = result.current;

    rerender();

    expect(result.current).toBe(firstResult);
  });
});
