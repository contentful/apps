import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useSidebarSlug } from '../../src/hooks/useSidebarSlug';
import { mockSdk } from '../mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('useSidebarSlug', () => {
  beforeEach(() => {
    // Reset mock to default state
    mockSdk.parameters.installation = {
      posthogApiKey: 'phx_test_api_key',
      posthogProjectId: '12345',
      posthogHost: 'us',
      contentTypes: {
        blogPost: {
          slugField: 'slug',
          urlPrefix: 'https://example.com/blog/',
        },
      },
    };
    mockSdk.contentType.sys.id = 'blogPost';
    mockSdk.entry.fields = {
      slug: {
        getValue: vi.fn().mockReturnValue('my-test-post'),
      },
    };
    mockSdk.locales.default = 'en-US';
  });

  it('should return the full page URL when properly configured', () => {
    const { result } = renderHook(() => useSidebarSlug());

    expect(result.current.pageUrl).toBe('https://example.com/blog/my-test-post');
    expect(result.current.slug).toBe('my-test-post');
    expect(result.current.error).toBeNull();
    expect(result.current.isConfigured).toBe(true);
    expect(result.current.config).toEqual({
      slugField: 'slug',
      urlPrefix: 'https://example.com/blog/',
    });
  });

  it('should handle URL prefix without trailing slash', () => {
    mockSdk.parameters.installation.contentTypes.blogPost.urlPrefix = 'https://example.com/blog';

    const { result } = renderHook(() => useSidebarSlug());

    expect(result.current.pageUrl).toBe('https://example.com/blog/my-test-post');
  });

  it('should handle slug with leading slash', () => {
    mockSdk.entry.fields.slug.getValue = vi.fn().mockReturnValue('/my-test-post');

    const { result } = renderHook(() => useSidebarSlug());

    expect(result.current.pageUrl).toBe('https://example.com/blog/my-test-post');
  });

  it('should return error when app is not configured', () => {
    mockSdk.parameters.installation = undefined;

    const { result } = renderHook(() => useSidebarSlug());

    expect(result.current.pageUrl).toBeNull();
    expect(result.current.slug).toBeNull();
    expect(result.current.error).toBe(
      'App is not configured. Please configure the app in the settings.'
    );
    expect(result.current.isConfigured).toBe(false);
  });

  it('should return error when contentTypes is missing', () => {
    mockSdk.parameters.installation = {
      posthogApiKey: 'phx_test_api_key',
      posthogProjectId: '12345',
      posthogHost: 'us',
    };

    const { result } = renderHook(() => useSidebarSlug());

    expect(result.current.pageUrl).toBeNull();
    expect(result.current.error).toBe(
      'App is not configured. Please configure the app in the settings.'
    );
    expect(result.current.isConfigured).toBe(false);
  });

  it('should return error when content type is not configured', () => {
    mockSdk.contentType.sys.id = 'landingPage';

    const { result } = renderHook(() => useSidebarSlug());

    expect(result.current.pageUrl).toBeNull();
    expect(result.current.error).toBe(
      'Content type "landingPage" is not configured for analytics. Configure the URL mapping in app settings.'
    );
    expect(result.current.isConfigured).toBe(false);
  });

  it('should return error when slug field does not exist on entry', () => {
    mockSdk.entry.fields = {};

    const { result } = renderHook(() => useSidebarSlug());

    expect(result.current.pageUrl).toBeNull();
    expect(result.current.error).toBe('Slug field "slug" not found on this entry.');
    expect(result.current.isConfigured).toBe(true);
    expect(result.current.config).toEqual({
      slugField: 'slug',
      urlPrefix: 'https://example.com/blog/',
    });
  });

  it('should return error when slug value is empty', () => {
    mockSdk.entry.fields.slug.getValue = vi.fn().mockReturnValue('');

    const { result } = renderHook(() => useSidebarSlug());

    expect(result.current.pageUrl).toBeNull();
    expect(result.current.error).toBe('No slug value found. Enter a slug to view analytics.');
    expect(result.current.isConfigured).toBe(true);
  });

  it('should return error when slug value is null', () => {
    mockSdk.entry.fields.slug.getValue = vi.fn().mockReturnValue(null);

    const { result } = renderHook(() => useSidebarSlug());

    expect(result.current.pageUrl).toBeNull();
    expect(result.current.error).toBe('No slug value found. Enter a slug to view analytics.');
    expect(result.current.isConfigured).toBe(true);
  });

  it('should return error when slug value is not a string', () => {
    mockSdk.entry.fields.slug.getValue = vi.fn().mockReturnValue(123);

    const { result } = renderHook(() => useSidebarSlug());

    expect(result.current.pageUrl).toBeNull();
    expect(result.current.error).toBe('No slug value found. Enter a slug to view analytics.');
    expect(result.current.isConfigured).toBe(true);
  });

  it('should handle multiple content types', () => {
    mockSdk.parameters.installation.contentTypes = {
      blogPost: {
        slugField: 'slug',
        urlPrefix: 'https://example.com/blog/',
      },
      landingPage: {
        slugField: 'pageUrl',
        urlPrefix: 'https://example.com/',
      },
    };
    mockSdk.contentType.sys.id = 'landingPage';
    mockSdk.entry.fields = {
      pageUrl: {
        getValue: vi.fn().mockReturnValue('about-us'),
      },
    };

    const { result } = renderHook(() => useSidebarSlug());

    expect(result.current.pageUrl).toBe('https://example.com/about-us');
    expect(result.current.slug).toBe('about-us');
    expect(result.current.config).toEqual({
      slugField: 'pageUrl',
      urlPrefix: 'https://example.com/',
    });
  });

  it('should use the default locale for field value', () => {
    mockSdk.locales.default = 'de-DE';
    const getValueMock = vi.fn().mockReturnValue('german-post');
    mockSdk.entry.fields.slug.getValue = getValueMock;

    renderHook(() => useSidebarSlug());

    expect(getValueMock).toHaveBeenCalledWith('de-DE');
  });
});
