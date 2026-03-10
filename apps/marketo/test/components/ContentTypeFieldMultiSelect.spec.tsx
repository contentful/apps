import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ContentTypeFieldMultiSelect from '../../src/components/ContentTypeFieldMultiSelect';
import { ContentTypeInfo } from '../../src/utils';
import { ContentTypeProps } from 'contentful-management';

const mockSdk: any = {
  app: {
    getCurrentState: vi.fn().mockResolvedValue({ EditorInterface: {} }),
  },
};

const mockUseContentTypes = vi.fn();

vi.mock('../../src/hooks/useContentTypes', () => ({
  useContentTypes: () => mockUseContentTypes(),
}));

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

const mockContentTypes: ContentTypeProps[] = [
  {
    sys: { id: 'blog-post', type: 'ContentType' },
    name: 'Blog Post',
    fields: [
      { id: 'title', name: 'Title', type: 'Symbol' },
      { id: 'content', name: 'Content', type: 'Object' },
    ],
  } as ContentTypeProps,
  {
    sys: { id: 'article', type: 'ContentType' },
    name: 'Article',
    fields: [
      { id: 'body', name: 'Body', type: 'Object' },
      { id: 'summary', name: 'Summary', type: 'Text' },
    ],
  } as ContentTypeProps,
];

const mockAvailableFields: ContentTypeInfo[] = [
  {
    fieldUniqueId: 'blog-post.content',
    displayName: 'Blog Post > Content',
    contentTypeId: 'blog-post',
    fieldId: 'content',
  },
  {
    fieldUniqueId: 'article.body',
    displayName: 'Article > Body',
    contentTypeId: 'article',
    fieldId: 'body',
  },
];

describe('ContentTypeFieldMultiSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseContentTypes.mockReturnValue({
      contentTypes: [],
      isLoading: false,
    });
  });

  it('renders placeholder when no fields are selected', async () => {
    mockUseContentTypes.mockReturnValue({
      contentTypes: mockContentTypes,
      isLoading: false,
    });

    const onSelectionChange = vi.fn();

    await act(async () => {
      render(
        <ContentTypeFieldMultiSelect
          selectedFields={[]}
          onSelectionChange={onSelectionChange}
          sdk={mockSdk}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Select one or more')).toBeInTheDocument();
    });
  });

  it('displays selected fields as pills', async () => {
    mockUseContentTypes.mockReturnValue({
      contentTypes: mockContentTypes,
      isLoading: false,
    });

    const onSelectionChange = vi.fn();

    await act(async () => {
      render(
        <ContentTypeFieldMultiSelect
          selectedFields={[mockAvailableFields[0]]}
          onSelectionChange={onSelectionChange}
          sdk={mockSdk}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getAllByText('Blog Post > Content').length).toBeGreaterThan(0);
      expect(screen.getByTestId('pill-Blog-Post-->-Content')).toBeInTheDocument();
    });
  });

  it('loads saved selections from app state', async () => {
    mockUseContentTypes.mockReturnValue({
      contentTypes: mockContentTypes,
      isLoading: false,
    });

    mockSdk.app.getCurrentState.mockResolvedValue({
      EditorInterface: {
        'blog-post': {
          controls: [{ fieldId: 'content' }],
        },
      },
    });

    const onSelectionChange = vi.fn();

    await act(async () => {
      render(
        <ContentTypeFieldMultiSelect
          selectedFields={[]}
          onSelectionChange={onSelectionChange}
          sdk={mockSdk}
        />
      );
    });

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalled();
      const callArgs = onSelectionChange.mock.calls[0][0];
      expect(callArgs).toHaveLength(1);
      expect(callArgs[0].fieldUniqueId).toBe('blog-post.content');
    });
  });
});
