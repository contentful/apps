import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useInstallationParameters } from '../../src/utils/useInstallationParameters';
import { mockSdk } from '../mocks/mockSdk';
import { BaseAppSDK } from '@contentful/app-sdk';

describe('useInstallationParameters', () => {
  it('should return sdk.parameters.installation directly', () => {
    const { result } = renderHook(() =>
      useInstallationParameters(mockSdk as unknown as BaseAppSDK)
    );

    expect(result.current).toEqual({
      cloneText: 'Copy',
      cloneTextBefore: true,
      automaticRedirect: true,
    });
  });
});
