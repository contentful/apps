import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useInstallationParameters } from '../../src/hooks/useInstallationParameters';
import { createMockSdk } from '../mocks/mockSdk';
import { AppInstallationParameters } from '../../src/utils/types';

describe('useInstallationParameters', () => {
  let mockSdk: ReturnType<typeof createMockSdk>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk = createMockSdk({
      parameters: {
        installation: {
          rules: [],
          separator: '-',
        } as AppInstallationParameters,
      },
    });
  });

  it('should return sdk.parameters.installation directly', () => {
    const { result } = renderHook(() => useInstallationParameters(mockSdk));

    expect(result.current).toEqual({
      rules: [],
      separator: '-',
    });
  });

  it('should return default parameters when sdk.parameters.installation is undefined', () => {
    mockSdk = createMockSdk({
      parameters: {
        installation: undefined,
      },
    });

    const { result } = renderHook(() => useInstallationParameters(mockSdk));

    expect(result.current).toEqual({
      rules: [],
      separator: '',
    });
  });

  it('should return parameters with rules when configured', () => {
    const configuredParameters: AppInstallationParameters = {
      rules: [
        {
          id: 'rule-1',
          parentField: {
            fieldUniqueId: 'blog-post.title',
            fieldId: 'title',
            fieldName: 'Title',
            contentTypeId: 'blog-post',
            contentTypeName: 'Blog Post',
            displayName: 'Title | Blog Post',
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

    mockSdk = createMockSdk({
      parameters: {
        installation: configuredParameters,
      },
    });

    const { result } = renderHook(() => useInstallationParameters(mockSdk));

    expect(result.current).toEqual(configuredParameters);
  });
});
