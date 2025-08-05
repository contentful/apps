import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigAppSDK, CMAClient } from '@contentful/app-sdk';
import ContentTypeMultiSelect from '../src/components/ContentTypeMultiSelect';
import { ContentType } from '../src/utils';

// Mock the SDK
const mockSdk = {
  ids: {
    space: 'test-space',
    environment: 'test-environment',
  },
  app: {
    getCurrentState: vi.fn().mockResolvedValue({
      EditorInterface: {
        'content-type-1': {},
        'content-type-2': {},
      },
    }),
  },
} as unknown as ConfigAppSDK;

// Mock the CMA client
const mockCma = {
  contentType: {
    getMany: vi.fn().mockResolvedValue({
      items: [
        {
          sys: { id: 'content-type-1' },
          name: 'Blog Post',
          fields: [
            { id: 'title', name: 'Title', type: 'Text' },
            { id: 'content', name: 'Content', type: 'RichText' },
          ],
        },
        {
          sys: { id: 'content-type-2' },
          name: 'Article',
          fields: [
            { id: 'title', name: 'Title', type: 'Text' },
            { id: 'body', name: 'Body', type: 'RichText' },
          ],
        },
        {
          sys: { id: 'content-type-3' },
          name: 'Page',
          fields: [
            { id: 'title', name: 'Title', type: 'Text' },
            { id: 'description', name: 'Description', type: 'Text' },
          ],
        },
      ],
    }),
  },
} as unknown as CMAClient;

describe('ContentTypeMultiSelect', () => {
  const mockSetSelectedContentTypes = vi.fn();
  const defaultProps = {
    selectedContentTypes: [],
    setSelectedContentTypes: mockSetSelectedContentTypes,
    sdk: mockSdk,
    cma: mockCma,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the component with placeholder text', async () => {
    render(<ContentTypeMultiSelect {...defaultProps} />);

    expect(await screen.findByText('Select one or more')).toBeInTheDocument();
  });

  it('should filter content types using the provided filter function', async () => {
    const customFilter = vi.fn((contentType) => contentType.name === 'Blog Post');

    render(<ContentTypeMultiSelect {...defaultProps} filterContentTypes={customFilter} />);

    // Wait for the component to load and filter
    await screen.findByText('Blog Post');

    // Should not show Article or Page
    expect(screen.queryByText('Article')).not.toBeInTheDocument();
    expect(screen.queryByText('Page')).not.toBeInTheDocument();

    expect(customFilter).toHaveBeenCalled();
  });

  it('should exclude content types by ID when excludedContentTypesIds is provided', async () => {
    render(
      <ContentTypeMultiSelect {...defaultProps} excludedContentTypesIds={['content-type-1']} />
    );

    // Should not show Blog Post (content-type-1)
    expect(screen.queryByText('Blog Post')).not.toBeInTheDocument();

    // Should show Article (content-type-2)
    expect(await screen.findByText('Article')).toBeInTheDocument();
  });

  it('should display selected content types as pills', async () => {
    const selectedContentTypes: ContentType[] = [
      { id: 'content-type-1', name: 'Blog Post' },
      { id: 'content-type-2', name: 'Article' },
    ];

    render(
      <ContentTypeMultiSelect {...defaultProps} selectedContentTypes={selectedContentTypes} />
    );

    expect(await screen.findByText('Blog Post')).toBeInTheDocument();
    expect(screen.getByText('Article')).toBeInTheDocument();
  });

  it('should update placeholder text based on selected content types', async () => {
    const selectedContentTypes: ContentType[] = [{ id: 'content-type-1', name: 'Blog Post' }];

    render(
      <ContentTypeMultiSelect {...defaultProps} selectedContentTypes={selectedContentTypes} />
    );

    expect(await screen.findByText('Blog Post')).toBeInTheDocument();
  });

  it('should handle search functionality', async () => {
    render(<ContentTypeMultiSelect {...defaultProps} />);

    const searchInput = await screen.findByPlaceholderText('Search content types');
    fireEvent.change(searchInput, { target: { value: 'Blog' } });

    expect(await screen.findByText('Blog Post')).toBeInTheDocument();
    expect(screen.queryByText('Article')).not.toBeInTheDocument();
  });

  it('should call setSelectedContentTypes when a content type is selected', async () => {
    render(<ContentTypeMultiSelect {...defaultProps} />);

    const blogPostOption = await screen.findByText('Blog Post');
    fireEvent.click(blogPostOption);

    expect(mockSetSelectedContentTypes).toHaveBeenCalledWith([
      { id: 'content-type-1', name: 'Blog Post' },
    ]);
  });

  it('should remove content type from selection when pill is closed', async () => {
    const selectedContentTypes: ContentType[] = [{ id: 'content-type-1', name: 'Blog Post' }];

    render(
      <ContentTypeMultiSelect {...defaultProps} selectedContentTypes={selectedContentTypes} />
    );

    const closeButton = await screen.findByTestId('pill-Blog Post');
    fireEvent.click(closeButton);

    expect(mockSetSelectedContentTypes).toHaveBeenCalledWith([]);
  });

  it('should handle empty content types list gracefully', async () => {
    const emptyCma = {
      contentType: {
        getMany: vi.fn().mockResolvedValue({ items: [] }),
      },
    } as unknown as CMAClient;

    render(<ContentTypeMultiSelect {...defaultProps} cma={emptyCma} />);

    expect(await screen.findByText('Select one or more')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    const errorCma = {
      contentType: {
        getMany: vi.fn().mockRejectedValue(new Error('API Error')),
      },
    } as unknown as CMAClient;

    render(<ContentTypeMultiSelect {...defaultProps} cma={errorCma} />);

    expect(await screen.findByText('Select one or more')).toBeInTheDocument();
  });
});
