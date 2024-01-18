import { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCustomApi } from './useCustomApi';
import { SdkWithCustomApiProvider } from '@context/SdkWithCustomApiProvider';

describe('useCustomApi', () => {
  // by default the context returns null, before the it's popuplated by the init call in the provider
  it('returns null', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SdkWithCustomApiProvider>{children}</SdkWithCustomApiProvider>
    );
    const { result } = renderHook(() => useCustomApi(), { wrapper });
    await waitFor(() => expect(result.current).toEqual(null));
  });
});
