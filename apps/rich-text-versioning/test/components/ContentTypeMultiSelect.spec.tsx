import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { FieldWithContext } from '../../src/utils';
import ContentTypeMultiSelect from '../../src/components/ContentTypeMultiSelect';

describe('ContentTypeMultiSelect component', () => {
  const mockAvailableFields: FieldWithContext[] = [
    {
      fieldUniqueId: 'blog-post.content',
      displayName: 'Blog Post > content',
      contentTypeId: 'blog-post',
      fieldId: 'content',
    },
    {
      fieldUniqueId: 'article.body',
      displayName: 'Article > body',
      contentTypeId: 'article',
      fieldId: 'body',
    },
    {
      fieldUniqueId: 'page.description',
      displayName: 'Page > description',
      contentTypeId: 'page',
      fieldId: 'description',
    },
  ];

  const mockSelectedFields: FieldWithContext[] = [
    mockAvailableFields[0], // Blog Post > content
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a placeholder text when no rich text fields are selected', async () => {
    const onSelectionChange = vi.fn();

    await act(async () => {
      render(
        <ContentTypeMultiSelect
          availableFields={mockAvailableFields}
          selectedFields={[]}
          onSelectionChange={onSelectionChange}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Select one or more')).toBeInTheDocument();
    });
  });

  it('should display selected rich text fields as pills', async () => {
    const onSelectionChange = vi.fn();

    await act(async () => {
      render(
        <ContentTypeMultiSelect
          availableFields={mockAvailableFields}
          selectedFields={mockAvailableFields}
          onSelectionChange={onSelectionChange}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('pill-Blog-Post-->-content')).toBeInTheDocument();
      expect(screen.getByTestId('pill-Article-->-body')).toBeInTheDocument();
      expect(screen.getByTestId('pill-Page-->-description')).toBeInTheDocument();
    });
  });

  it('should show single rich text field name when one is selected', async () => {
    const onSelectionChange = vi.fn();

    await act(async () => {
      render(
        <ContentTypeMultiSelect
          availableFields={mockAvailableFields}
          selectedFields={mockSelectedFields}
          onSelectionChange={onSelectionChange}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('pill-Blog-Post-->-content')).toBeInTheDocument();
    });
  });

  it('should show multiple rich text fields with count when more than one is selected', async () => {
    const onSelectionChange = vi.fn();

    await act(async () => {
      render(
        <ContentTypeMultiSelect
          availableFields={mockAvailableFields}
          selectedFields={mockAvailableFields}
          onSelectionChange={onSelectionChange}
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
