import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSpaceType } from './useSpaceType';
import { mockCma } from '../../test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => ({ cma: mockCma }),
}));

describe('useSpaceType', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves to exo when component types are present', async () => {
    mockCma.componentType = {
      getMany: vi.fn().mockResolvedValue({ total: 1, items: [] }),
    };
    mockCma.contentType = {
      getMany: vi.fn().mockResolvedValue({ total: 0, items: [] }),
    };

    const { result } = renderHook(() => useSpaceType());
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.disposition).toBe('exo');
  });

  it('resolves to classic when only content types are present', async () => {
    mockCma.componentType = {
      getMany: vi.fn().mockResolvedValue({ total: 0, items: [] }),
    };
    mockCma.contentType = {
      getMany: vi.fn().mockResolvedValue({ total: 4, items: [] }),
    };

    const { result } = renderHook(() => useSpaceType());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.disposition).toBe('classic');
  });
});
