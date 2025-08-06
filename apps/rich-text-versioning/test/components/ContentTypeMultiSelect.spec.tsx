import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import { ContentType } from '../../src/utils';
import ContentTypeMultiSelect from '../../src/components/ContentTypeMultiSelect';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

interface RichTextFieldWithContext {
  id: string;
  name: string;
  contentTypeId: string;
  contentTypeName: string;
  displayName: string;
}

describe('ContentTypeMultiSelect component', () => {
  const mockRichTextFields: RichTextFieldWithContext[] = [
    {
      id: 'blog-post.content',
      name: 'content',
      contentTypeId: 'blog-post',
      contentTypeName: 'Blog Post',
      displayName: 'Blog Post > content',
    },
    {
      id: 'article.body',
      name: 'body',
      contentTypeId: 'article',
      contentTypeName: 'Article',
      displayName: 'Article > body',
    },
    {
      id: 'page.description',
      name: 'description',
      contentTypeId: 'page',
      contentTypeName: 'Page',
      displayName: 'Page > description',
    },
  ];

  const mockCmaResponse = {
    items: [
      {
        sys: { id: 'blog-post' },
        name: 'Blog Post',
        fields: [
          { id: 'content', name: 'content', type: 'RichText' },
          { id: 'title', name: 'title', type: 'Text' },
        ],
      },
      {
        sys: { id: 'article' },
        name: 'Article',
        fields: [
          { id: 'body', name: 'body', type: 'RichText' },
          { id: 'author', name: 'author', type: 'Text' },
        ],
      },
      {
        sys: { id: 'page' },
        name: 'Page',
        fields: [
          { id: 'description', name: 'description', type: 'RichText' },
          { id: 'slug', name: 'slug', type: 'Text' },
        ],
      },
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
    const setSelectedRichTextFields = vi.fn();

    await act(async () => {
      render(
        <ContentTypeMultiSelect
          selectedRichTextFields={[]}
          setSelectedRichTextFields={setSelectedRichTextFields}
          sdk={mockSdk}
          cma={mockCma}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Select one or more rich text fields')).toBeInTheDocument();
    });
  });

  it('should display selected rich text fields as pills', async () => {
    const setSelectedRichTextFields = vi.fn();

    await act(async () => {
      render(
        <ContentTypeMultiSelect
          selectedRichTextFields={mockRichTextFields}
          setSelectedRichTextFields={setSelectedRichTextFields}
          sdk={mockSdk}
          cma={mockCma}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('pill-Blog-Post-->-content')).toBeInTheDocument();
      expect(screen.getByTestId('pill-Article-->-body')).toBeInTheDocument();
      expect(screen.getByTestId('pill-Page-->-description')).toBeInTheDocument();
    });
  });

  it('should show placeholder text when no rich text fields are selected', async () => {
    const setSelectedRichTextFields = vi.fn();

    await act(async () => {
      render(
        <ContentTypeMultiSelect
          selectedRichTextFields={[]}
          setSelectedRichTextFields={setSelectedRichTextFields}
          sdk={mockSdk}
          cma={mockCma}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Select one or more rich text fields')).toBeInTheDocument();
    });
  });

  it('should show single rich text field name when one is selected', async () => {
    const setSelectedRichTextFields = vi.fn();

    await act(async () => {
      render(
        <ContentTypeMultiSelect
          selectedRichTextFields={[mockRichTextFields[0]]}
          setSelectedRichTextFields={setSelectedRichTextFields}
          sdk={mockSdk}
          cma={mockCma}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('pill-Blog-Post-->-content')).toBeInTheDocument();
    });
  });

  it('should show multiple rich text fields with count when more than one is selected', async () => {
    const setSelectedRichTextFields = vi.fn();

    await act(async () => {
      render(
        <ContentTypeMultiSelect
          selectedRichTextFields={mockRichTextFields}
          setSelectedRichTextFields={setSelectedRichTextFields}
          sdk={mockSdk}
          cma={mockCma}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Blog Post > content and 2 more')).toBeInTheDocument();
      expect(screen.getByTestId('pill-Blog-Post-->-content')).toBeInTheDocument();
      expect(screen.getByTestId('pill-Article-->-body')).toBeInTheDocument();
      expect(screen.getByTestId('pill-Page-->-description')).toBeInTheDocument();
    });
  });
});
