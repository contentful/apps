import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ContentTypeProps } from 'contentful-management';
import { useContentTypes } from '../src/hooks/useContentTypes';
import { mockSdk } from './mocks/mockSdk';
import { mockCma } from './mocks/mockCma';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('useContentTypes', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and returns all content types successfully', async () => {
    const mockContentTypes = [mockBlogPost, mockArticle, mockPage];

    vi.mocked(mockCma.contentType.getMany).mockResolvedValue({
      items: mockContentTypes,
    });

    const { result } = renderHook(() => useContentTypes());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.contentTypes).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.contentTypes).toEqual(mockContentTypes);
    expect(result.current.isLoading).toBe(false);
    expect(mockCma.contentType.getMany).toHaveBeenCalledWith({
      query: { skip: 0, limit: 1000 },
    });
  });

  it('fetches specific content types when contentTypeIds are provided', async () => {
    const mockContentTypes = [mockBlogPost, mockArticle];

    vi.mocked(mockCma.contentType.get)
      .mockResolvedValueOnce(mockBlogPost)
      .mockResolvedValueOnce(mockArticle);

    const contentTypeIds = ['blogPost', 'article'];
    const { result } = renderHook(() => useContentTypes(contentTypeIds));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.contentTypes).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.contentTypes).toEqual(mockContentTypes);
    expect(result.current.isLoading).toBe(false);
    expect(mockCma.contentType.get).toHaveBeenCalledTimes(2);
    expect(mockCma.contentType.get).toHaveBeenCalledWith({
      contentTypeId: 'blogPost',
      query: {
        fields: ['name', 'displayField'],
      },
    });
    expect(mockCma.contentType.get).toHaveBeenCalledWith({
      contentTypeId: 'article',
      query: {
        fields: ['name', 'displayField'],
      },
    });
  });

  it('handles errors gracefully when fetching specific content types', async () => {
    vi.mocked(mockCma.contentType.get)
      .mockResolvedValueOnce(mockBlogPost)
      .mockRejectedValueOnce(new Error('Failed to fetch content type'));

    const contentTypeIds = ['blogPost', 'invalid'];
    const { result } = renderHook(() => useContentTypes(contentTypeIds));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should only include the successfully fetched content type
    expect(result.current.contentTypes).toEqual([mockBlogPost]);
    expect(result.current.isLoading).toBe(false);
  });

  it('handles pagination when fetching all content types', async () => {
    const firstBatch: ContentTypeProps[] = Array.from({ length: 1000 }, (_, i) => ({
      sys: { id: `contentType${i}`, type: 'ContentType' } as any,
      name: `Content Type ${i}`,
    })) as ContentTypeProps[];

    const secondBatch: ContentTypeProps[] = Array.from({ length: 500 }, (_, i) => ({
      sys: { id: `contentType${i + 1000}`, type: 'ContentType' } as any,
      name: `Content Type ${i + 1000}`,
    })) as ContentTypeProps[];

    vi.mocked(mockCma.contentType.getMany)
      .mockResolvedValueOnce({
        items: firstBatch,
      })
      .mockResolvedValueOnce({
        items: secondBatch,
      });

    const { result } = renderHook(() => useContentTypes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.contentTypes).toHaveLength(1500);
    expect(mockCma.contentType.getMany).toHaveBeenCalledTimes(2);
    expect(mockCma.contentType.getMany).toHaveBeenNthCalledWith(1, {
      query: { skip: 0, limit: 1000 },
    });
    expect(mockCma.contentType.getMany).toHaveBeenNthCalledWith(2, {
      query: { skip: 1000, limit: 1000 },
    });
  });

  it('returns empty array when no content types are found', async () => {
    vi.mocked(mockCma.contentType.getMany).mockResolvedValue({
      items: [],
    });

    const { result } = renderHook(() => useContentTypes());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.contentTypes).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('handles empty contentTypeIds array', async () => {
    const emptyArray: string[] = [];

    vi.mocked(mockCma.contentType.getMany).mockResolvedValue({
      items: [mockBlogPost],
    });

    const { result } = renderHook(() => useContentTypes(emptyArray));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.contentTypes).toEqual([mockBlogPost]);
  });
});
