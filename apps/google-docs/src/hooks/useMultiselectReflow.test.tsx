import { describe, it, expect, vi } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import { useMultiselectScrollReflow } from './useMultiselectReflow';

function TestComponent({ selection }: { selection: unknown[] }) {
  const ref = useMultiselectScrollReflow(selection);
  return <ul ref={ref} data-testid="list" />;
}

describe('useMultiselectScrollReflow', () => {
  it('returns a ref object with current property', () => {
    const { result } = renderHook(() => useMultiselectScrollReflow([]));

    expect(result.current).toHaveProperty('current');
    expect(result.current.current).toBeNull();
  });

  it('accepts empty selection', () => {
    const { result } = renderHook(() => useMultiselectScrollReflow([]));

    expect(result.current).toBeDefined();
    expect(result.current.current).toBeNull();
  });

  it('accepts non-empty selection', () => {
    const { result } = renderHook(() => useMultiselectScrollReflow([{ id: '1', name: 'Item 1' }]));

    expect(result.current).toBeDefined();
  });
});
