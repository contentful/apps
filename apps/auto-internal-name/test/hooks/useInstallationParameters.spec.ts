import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useInstallationParameters } from '../../src/hooks/useInstallationParameters';
import { createMockSdk } from '../mocks/mockSdk';
import { createMockCma } from '../mocks/mockCma';
import { AppInstallationParameters } from '../../src/utils/types';
import { AppInstallationProps } from 'contentful-management';

describe('useInstallationParameters', () => {
  let mockCma: ReturnType<typeof createMockCma>;
  let mockSdk: ReturnType<typeof createMockSdk>;
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    mockCma = createMockCma();
    mockSdk = createMockSdk({
      ids: {
        app: 'test-app',
        space: 'test-space',
        organization: 'test-org',
        environment: 'test-environment',
      },
      parameters: {
        installation: {
          rules: [],
          separator: '',
        } as AppInstallationParameters,
      },
      cma: mockCma,
    });
  });

  afterEach(() => {
    consoleWarnSpy.mockClear();
  });

  describe('Initial state', () => {
    it('should return initial parameters from sdk.parameters.installation', () => {
      const { result } = renderHook(() => useInstallationParameters(mockSdk));

      expect(result.current).toEqual({
        rules: [],
        separator: '',
      });
    });
  });

  describe('Successful parameter fetch', () => {
    it('should fetch and return fresh parameters from CMA when installation matches space', async () => {
      const freshParameters: AppInstallationParameters = {
        rules: [
          {
            id: 'rule-1',
            parentField: {
              fieldUniqueId: 'blog-post.slug',
              fieldId: 'slug',
              fieldName: 'Slug',
              contentTypeId: 'blog-post',
              contentTypeName: 'Blog Post',
              displayName: 'Slug | Blog Post',
            },
            referenceField: {
              fieldUniqueId: 'blog-post.slug',
              fieldId: 'slug',
              fieldName: 'Slug',
              contentTypeId: 'blog-post',
              contentTypeName: 'Blog Post',
              displayName: 'Slug | Blog Post',
            },
          },
        ],
        separator: '_',
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
        expect(result.current).toEqual(freshParameters);
      });

      expect(mockCma.appInstallation.getForOrganization).toHaveBeenCalledWith({
        appDefinitionId: 'test-app',
        organizationId: 'test-org',
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
          rules: [],
          separator: '_',
        },
      } as unknown as AppInstallationProps;

      mockCma.appInstallation.getForOrganization = vi.fn().mockResolvedValue({
        items: [mockInstallation],
      });

      const { result } = renderHook(() => useInstallationParameters(mockSdk));

      await waitFor(() => {
        expect(result.current).toEqual({
          rules: [],
          separator: '',
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
        expect(result.current).toEqual({
          rules: [],
          separator: '',
        });
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to fetch fresh parameters from CMA:',
        expect.any(Error)
      );
    });
  });
});
