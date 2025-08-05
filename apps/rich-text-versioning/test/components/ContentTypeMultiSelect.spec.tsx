import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import { ContentType } from '../../src/utils';
import ContentTypeMultiSelect from '../../src/components/ContentTypeMultiSelect';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('ContentTypeMultiSelect component', () => {
  const mockContentTypes: ContentType[] = [
    { id: 'blog-post', name: 'Blog Post' },
    { id: 'article', name: 'Article' },
    { id: 'page', name: 'Page' },
  ];

  const mockCmaResponse = {
    items: [
      { sys: { id: 'blog-post' }, name: 'Blog Post' },
      { sys: { id: 'article' }, name: 'Article' },
      { sys: { id: 'page' }, name: 'Page' },
    ],
    total: 3,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.ids.space = 'test-space';
    mockSdk.ids.environment = 'test-environment';
    mockSdk.app.getCurrentState.mockResolvedValue({});
    mockSdk.cma.contentType.getMany.mockResolvedValue(mockCmaResponse);
  });

  it('should render the multiselect component', async () => {
    const setSelectedContentTypes = vi.fn();

    await act(async () => {
      render(
        <ContentTypeMultiSelect
          selectedContentTypes={[]}
          setSelectedContentTypes={setSelectedContentTypes}
          sdk={mockSdk}
          cma={mockCma}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Select one or more')).toBeInTheDocument();
    });
  });

  it('should display selected content types as pills', async () => {
    const setSelectedContentTypes = vi.fn();

    await act(async () => {
      render(
        <ContentTypeMultiSelect
          selectedContentTypes={mockContentTypes}
          setSelectedContentTypes={setSelectedContentTypes}
          sdk={mockSdk}
          cma={mockCma}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Blog Post')).toBeInTheDocument();
      expect(screen.getByText('Article')).toBeInTheDocument();
      expect(screen.getByText('Page')).toBeInTheDocument();
    });
  });

  it('should show placeholder text when no content types are selected', async () => {
    const setSelectedContentTypes = vi.fn();

    await act(async () => {
      render(
        <ContentTypeMultiSelect
          selectedContentTypes={[]}
          setSelectedContentTypes={setSelectedContentTypes}
          sdk={mockSdk}
          cma={mockCma}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Select one or more')).toBeInTheDocument();
    });
  });

  it('should show single content type name when one is selected', async () => {
    const setSelectedContentTypes = vi.fn();

    await act(async () => {
      render(
        <ContentTypeMultiSelect
          selectedContentTypes={[mockContentTypes[0]]}
          setSelectedContentTypes={setSelectedContentTypes}
          sdk={mockSdk}
          cma={mockCma}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('pill-Blog Post')).toBeInTheDocument();
    });
  });

  it('should show multiple content types with count when more than one is selected', async () => {
    const setSelectedContentTypes = vi.fn();

    await act(async () => {
      render(
        <ContentTypeMultiSelect
          selectedContentTypes={mockContentTypes}
          setSelectedContentTypes={setSelectedContentTypes}
          sdk={mockSdk}
          cma={mockCma}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Blog Post and 2 more')).toBeInTheDocument();
      expect(screen.getByTestId('pill-Blog Post')).toBeInTheDocument();
      expect(screen.getByTestId('pill-Article')).toBeInTheDocument();
      expect(screen.getByTestId('pill-Page')).toBeInTheDocument();
    });
  });
});
