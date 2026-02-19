import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useInstallationParameters } from '../../src/utils/useInstallationParameters';
import { mockSdk } from '../mocks/mockSdk';
import { mockCma } from '../mocks/mockCma';
import { BaseAppSDK } from '@contentful/app-sdk';

describe('useInstallationParameters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return parameters from appInstallation.getForOrganization when successful', async () => {
    const mockAppInstallationResponse = {
      items: [
        {
          sys: { space: { sys: { id: 'test-space' } } },
          parameters: {
            cloneText: 'Custom Copy',
            cloneTextBefore: false,
            automaticRedirect: false,
          },
        },
      ],
    };

    mockCma.appInstallation.getForOrganization.mockResolvedValue(mockAppInstallationResponse);

    const { result } = renderHook(() =>
      useInstallationParameters(mockSdk as unknown as BaseAppSDK)
    );

    expect(result.current).toEqual({
      cloneText: 'Copy',
      cloneTextBefore: true,
      automaticRedirect: true,
    });

    await waitFor(() => {
      expect(result.current).toEqual({
        cloneText: 'Custom Copy',
        cloneTextBefore: false,
        automaticRedirect: false,
      });
    });

    expect(mockCma.appInstallation.getForOrganization).toHaveBeenCalledWith({
      appDefinitionId: 'test-app',
      organizationId: 'test-organization',
    });
  });

  it('should return sdk.parameters.installation when appInstallation.getForOrganization throws an error', async () => {
    mockCma.appInstallation.getForOrganization.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      useInstallationParameters(mockSdk as unknown as BaseAppSDK)
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        cloneText: 'Copy',
        cloneTextBefore: true,
        automaticRedirect: true,
      });
    });

    expect(mockCma.appInstallation.getForOrganization).toHaveBeenCalledWith({
      appDefinitionId: 'test-app',
      organizationId: 'test-organization',
    });
  });
});
