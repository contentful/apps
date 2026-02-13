import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useInstallationParameters } from '../src/hooks/useInstallationParameters';
import { mockSdk } from './mocks/mockSdk';
import { mockCma } from './mocks/mockCma';
import { AppInstallationProps } from 'contentful-management';

describe('useInstallationParameters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should return initial parameters from sdk.parameters.installation', () => {
      const { result } = renderHook(() => useInstallationParameters(mockSdk));

      expect(result.current.parameters).toEqual({ testParameter: 'test-parameter' });
      expect(result.current.refetchInstallationParameters).toBeTypeOf('function');
    });
  });

  describe('Successful parameter fetch', () => {
    it('should fetch and return fresh parameters from CMA when installation matches space', async () => {
      const freshParameters = {
        testParameter: 'fresh-parameter',
      };

      const mockInstallation = {
        sys: {
          id: 'installation-1',
          space: {
            sys: {
              id: 'test-space',
              type: 'Link',
              linkType: 'Space',
            },
          },
        },
        parameters: freshParameters,
      } as unknown as AppInstallationProps;

      mockCma.appInstallation.getForOrganization = vi.fn().mockResolvedValue({
        items: [mockInstallation],
      });

      const { result } = renderHook(() => useInstallationParameters(mockSdk));

      await waitFor(() => {
        expect(result.current.parameters).toEqual(freshParameters);
      });

      expect(mockCma.appInstallation.getForOrganization).toHaveBeenCalledWith({
        appDefinitionId: 'test-app',
        organizationId: 'test-organization',
      });
    });

    it('should return sdk parameters when no installation matches the space', async () => {
      const mockInstallation = {
        sys: {
          id: 'installation-1',
          space: {
            sys: {
              id: 'other-space',
              type: 'Link',
              linkType: 'Space',
            },
          },
        },
        parameters: {
          testParameter: 'other-parameter',
        },
      } as unknown as AppInstallationProps;

      mockCma.appInstallation.getForOrganization = vi.fn().mockResolvedValue({
        items: [mockInstallation],
      });

      const { result } = renderHook(() => useInstallationParameters(mockSdk));

      await waitFor(() => {
        expect(result.current.parameters).toEqual({
          testParameter: 'test-parameter',
        });
      });
    });
  });

  describe('Error handling', () => {
    it('should fallback to sdk parameters when CMA fetch fails', async () => {
      mockCma.appInstallation.getForOrganization = vi
        .fn()
        .mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useInstallationParameters(mockSdk));

      await waitFor(() => {
        expect(result.current.parameters).toEqual({
          testParameter: 'test-parameter',
        });
      });
    });
  });
});
