import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContentTypeProps } from 'contentful-management';
import { mockSdk } from '../mocks';
import { useContentTypes } from '../../src/hooks/useContentTypes';
import { fetchContentTypes } from '../../src/utils/fetchContentTypes';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

vi.mock('../../src/utils/fetchContentTypes');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('useContentTypes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and returns content types successfully', async () => {
    const mockBlogPost: ContentTypeProps = {
      sys: { id: 'blogPost', type: 'ContentType' } as any,
      name: 'Blog Post',
    } as ContentTypeProps;
    const mockArticle: ContentTypeProps = {
      sys: { id: 'article', type: 'ContentType' } as any,
      name: 'Article',
    } as ContentTypeProps;
    const mockPage: ContentTypeProps = {
      sys: { id: 'page', type: 'ContentType' } as any,
      name: 'Page',
    } as ContentTypeProps;

    const mockContentTypes = new Map([
      ['blogPost', mockBlogPost],
      ['article', mockArticle],
      ['page', mockPage],
    ]);

    const mockFetchedAt = new Date('2024-01-01T00:00:00Z');
    vi.mocked(fetchContentTypes).mockResolvedValue({
      contentTypes: mockContentTypes,
      fetchedAt: mockFetchedAt,
    });

    const { result } = renderHook(() => useContentTypes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isFetchingContentTypes).toBe(false);
    });

    expect(result.current.contentTypes).toEqual(mockContentTypes);
    expect(result.current.isFetchingContentTypes).toBe(false);
    expect(result.current.fetchingContentTypesError).toBeNull();
    expect(result.current.fetchedAt).toEqual(mockFetchedAt);
    expect(fetchContentTypes).toHaveBeenCalledWith(mockSdk, undefined);
  });

  it('fetches specific content types when contentTypeIds are provided', async () => {
    const mockBlogPost: ContentTypeProps = {
      sys: { id: 'blogPost', type: 'ContentType' } as any,
      name: 'Blog Post',
    } as ContentTypeProps;
    const mockArticle: ContentTypeProps = {
      sys: { id: 'article', type: 'ContentType' } as any,
      name: 'Article',
    } as ContentTypeProps;

    const mockContentTypes = new Map([
      ['blogPost', mockBlogPost],
      ['article', mockArticle],
    ]);

    vi.mocked(fetchContentTypes).mockResolvedValue({
      contentTypes: mockContentTypes,
      fetchedAt: new Date(),
    });

    const contentTypeIds = ['blogPost', 'article'];
    const { result } = renderHook(() => useContentTypes(contentTypeIds), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isFetchingContentTypes).toBe(false);
    });

    expect(result.current.contentTypes).toEqual(mockContentTypes);
    expect(fetchContentTypes).toHaveBeenCalledWith(mockSdk, contentTypeIds);
  });

  it('handles errors gracefully', async () => {
    const mockError = new Error('Failed to fetch content types');
    vi.mocked(fetchContentTypes).mockRejectedValue(mockError);

    const { result } = renderHook(() => useContentTypes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isFetchingContentTypes).toBe(false);
    });

    expect(result.current.contentTypes).toEqual(new Map());
    expect(result.current.isFetchingContentTypes).toBe(false);
    expect(result.current.fetchingContentTypesError).toEqual(mockError);
    expect(result.current.fetchedAt).toBeUndefined();
  });

  it('returns empty map when no content types are found', async () => {
    vi.mocked(fetchContentTypes).mockResolvedValue({
      contentTypes: new Map(),
      fetchedAt: new Date(),
    });

    const { result } = renderHook(() => useContentTypes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isFetchingContentTypes).toBe(false);
    });

    expect(result.current.contentTypes).toEqual(new Map());
    expect(result.current.isFetchingContentTypes).toBe(false);
    expect(result.current.fetchingContentTypesError).toBeNull();
  });
});
