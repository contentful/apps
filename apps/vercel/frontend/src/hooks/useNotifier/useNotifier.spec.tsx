import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useNotifier } from './useNotifier';
import { mockSdk } from '../../../test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('useNotifier', () => {
  it('should call notification api to display copy message', async () => {
    const copiedMessage = '{token}';
    const mockNotifier = vi.fn();
    mockSdk.notifier.success = mockNotifier;

    renderHook(() => {
      useNotifier().copySuccess(copiedMessage);
    });

    expect(mockNotifier).toBeCalledWith(`${copiedMessage} copied to clipboard`);
  });

  it('should call notification api to display error message', async () => {
    const errorMessage = 'Cannot save at this time';
    const mockNotifier = vi.fn();
    mockSdk.notifier.error = mockNotifier;

    renderHook(() => {
      useNotifier().error(errorMessage);
    });

    expect(mockNotifier).toBeCalledWith(errorMessage);
  });
});
