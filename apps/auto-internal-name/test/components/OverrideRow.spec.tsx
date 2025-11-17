import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import OverrideRow from '../../src/components/OverrideRow';
import { ContentTypeProps } from 'contentful-management';
import { Override, OverrideError } from '../../src/utils/types';

describe('OverrideRow', () => {
  const mockContentTypes: ContentTypeProps[] = [
    {
      sys: { id: 'ct-1', type: 'ContentType' },
      name: 'Blog Post',
      fields: [
        { id: 'title', name: 'Title', type: 'Symbol', required: false },
        { id: 'slug', name: 'Slug', type: 'Symbol', required: false },
        { id: 'author', name: 'Author', type: 'Link', required: false },
        { id: 'body', name: 'Body', type: 'Text', required: false },
      ],
    } as ContentTypeProps,
    {
      sys: { id: 'ct-2', type: 'ContentType' },
      name: 'Author',
      fields: [
        { id: 'name', name: 'Name', type: 'Symbol', required: false },
        { id: 'email', name: 'Email', type: 'Symbol', required: false },
        { id: 'bio', name: 'Bio', type: 'Text', required: false },
      ],
    } as ContentTypeProps,
  ];

  const mockOverride: Override = {
    id: 'override-1',
    contentTypeId: '',
    fieldId: '',
  };

  const mockOnOverrideChange = vi.fn();
  const mockOnOverrideDelete = vi.fn();

  const mockOverrideError: OverrideError = {
    isContentTypeMissing: false,
    isFieldMissing: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component with content type and field inputs', () => {
      render(
        <OverrideRow
          contentTypes={mockContentTypes}
          overrideItem={mockOverride}
          onOverrideChange={mockOnOverrideChange}
          onOverrideDelete={mockOnOverrideDelete}
          overrideError={mockOverrideError}
          overrides={[mockOverride]}
        />
      );

      expect(screen.getByLabelText(/content type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/field name/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete override/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Content type name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Field name')).toBeInTheDocument();
    });

    it('should disable field name input when no content type is selected', () => {
      render(
        <OverrideRow
          contentTypes={mockContentTypes}
          overrideItem={mockOverride}
          onOverrideChange={mockOnOverrideChange}
          onOverrideDelete={mockOnOverrideDelete}
          overrideError={mockOverrideError}
          overrides={[mockOverride]}
        />
      );

      const fieldInput = screen.getByPlaceholderText('Field name');
      expect(fieldInput).toBeDisabled();
    });
  });

  describe('Content type selection', () => {
    it('should update override when content type is selected', async () => {
      const user = userEvent.setup();
      const onOverrideChangeSpy = vi.fn();

      render(
        <OverrideRow
          contentTypes={mockContentTypes}
          overrideItem={mockOverride}
          onOverrideChange={onOverrideChangeSpy}
          onOverrideDelete={mockOnOverrideDelete}
          overrideError={mockOverrideError}
          overrides={[mockOverride]}
        />
      );

      const contentTypeInput = screen.getByPlaceholderText('Content type name');
      await user.type(contentTypeInput, 'Blog');

      await waitFor(() => {
        expect(contentTypeInput).toHaveValue('Blog');
      });

      const option = await screen.findByText('Blog Post');
      await user.click(option);

      await waitFor(() => {
        expect(onOverrideChangeSpy).toHaveBeenCalledWith({
          id: 'override-1',
          contentTypeId: 'ct-1',
          fieldId: '',
        });
      });
    });

    it('should clear field selection when content type changes', async () => {
      const user = userEvent.setup();
      const overrideWithContentType: Override = {
        id: 'override-1',
        contentTypeId: 'ct-1',
        fieldId: 'title',
      };

      const onOverrideChangeSpy = vi.fn();

      render(
        <OverrideRow
          contentTypes={mockContentTypes}
          overrideItem={overrideWithContentType}
          onOverrideChange={onOverrideChangeSpy}
          onOverrideDelete={mockOnOverrideDelete}
          overrideError={mockOverrideError}
          overrides={[overrideWithContentType]}
        />
      );

      const contentTypeInput = screen.getByPlaceholderText('Content type name');
      await user.clear(contentTypeInput);
      await user.click(contentTypeInput);

      const option = screen.getAllByRole('option', { name: 'Author' })[0] as HTMLElement;
      await user.click(option);

      await waitFor(() => {
        expect(contentTypeInput).toHaveValue('Author');
      });

      // Verify that the function was called with the updated override
      expect(onOverrideChangeSpy).toHaveBeenCalledWith({
        id: 'override-1',
        contentTypeId: 'ct-2',
        fieldId: '',
      });
    });

    it('should reset fields when content type input is cleared', async () => {
      const user = userEvent.setup();
      const overrideWithContentType: Override = {
        id: 'override-1',
        contentTypeId: 'ct-1',
        fieldId: 'title',
      };

      const onOverrideChangeSpy = vi.fn();

      render(
        <OverrideRow
          contentTypes={mockContentTypes}
          overrideItem={overrideWithContentType}
          onOverrideChange={onOverrideChangeSpy}
          onOverrideDelete={mockOnOverrideDelete}
          overrideError={mockOverrideError}
          overrides={[overrideWithContentType]}
        />
      );

      const contentTypeInput = screen.getByPlaceholderText('Content type name');

      await user.clear(contentTypeInput);
      await user.click(contentTypeInput);

      const option = await screen.findByText('Blog Post');
      await user.click(option);

      await waitFor(() => {
        expect(contentTypeInput).toHaveValue('Blog Post');
      });

      await user.clear(contentTypeInput);

      await waitFor(() => {
        expect(contentTypeInput).toHaveValue('');
        expect(onOverrideChangeSpy).toHaveBeenCalled();
      });

      // Verify that the function was called with cleared values
      expect(onOverrideChangeSpy).toHaveBeenCalledWith({
        id: 'override-1',
        contentTypeId: '',
        fieldId: '',
      });
    });
  });

  describe('Field selection', () => {
    it('should enable field input when content type is selected', async () => {
      const overrideWithContentType: Override = {
        id: 'override-1',
        contentTypeId: 'ct-1',
        fieldId: '',
      };

      render(
        <OverrideRow
          contentTypes={mockContentTypes}
          overrideItem={overrideWithContentType}
          onOverrideChange={mockOnOverrideChange}
          onOverrideDelete={mockOnOverrideDelete}
          overrideError={mockOverrideError}
          overrides={[overrideWithContentType]}
        />
      );

      const fieldInput = screen.getByPlaceholderText('Field name');
      expect(fieldInput).not.toBeDisabled();
    });

    it('should update override when field is selected', async () => {
      const user = userEvent.setup();
      const overrideWithContentType: Override = {
        id: 'override-1',
        contentTypeId: 'ct-2',
        fieldId: '',
      };

      const onOverrideChangeSpy = vi.fn();

      render(
        <OverrideRow
          contentTypes={mockContentTypes}
          overrideItem={overrideWithContentType}
          onOverrideChange={onOverrideChangeSpy}
          onOverrideDelete={mockOnOverrideDelete}
          overrideError={mockOverrideError}
          overrides={[overrideWithContentType]}
        />
      );

      // Content type is already set, so field input should be enabled
      const fieldInput = screen.getByPlaceholderText('Field name');
      expect(fieldInput).not.toBeDisabled();
      await user.clear(fieldInput);
      await user.click(fieldInput);

      // Wait for the dropdown to render and find the option
      const fieldOption = screen.getAllByRole('option', { name: 'Name' })[0] as HTMLElement;
      await user.click(fieldOption);

      await waitFor(() => {
        expect(fieldInput).toHaveValue('Name');
        expect(onOverrideChangeSpy).toHaveBeenCalled();
      });

      // Verify that the function was called with the updated override
      expect(onOverrideChangeSpy).toHaveBeenCalledWith({
        id: 'override-1',
        contentTypeId: 'ct-2',
        fieldId: 'name',
      });
    });
  });

  describe('Delete functionality', () => {
    it('should call onOverrideDelete with override id when delete is clicked', async () => {
      const user = userEvent.setup();
      const overrides: Override[] = [
        mockOverride,
        { id: 'override-2', contentTypeId: 'ct-1', fieldId: 'title' },
      ];

      const onOverrideDeleteSpy = vi.fn();

      render(
        <OverrideRow
          contentTypes={mockContentTypes}
          overrideItem={mockOverride}
          onOverrideChange={mockOnOverrideChange}
          onOverrideDelete={onOverrideDeleteSpy}
          overrideError={mockOverrideError}
          overrides={overrides}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete override/i });
      await user.click(deleteButton);

      // Should call onOverrideDelete with the override id
      await waitFor(() => {
        expect(onOverrideDeleteSpy).toHaveBeenCalledWith('override-1');
      });
    });

    it('should remove only the specific override when delete is clicked', async () => {
      const user = userEvent.setup();
      const overrides: Override[] = [
        { id: 'override-1', contentTypeId: 'ct-1', fieldId: 'title' },
        { id: 'override-2', contentTypeId: 'ct-2', fieldId: 'name' },
        { id: 'override-3', contentTypeId: 'ct-1', fieldId: 'slug' },
      ];

      const onOverrideDeleteSpy = vi.fn();

      const overrideToDelete = overrides[1];

      render(
        <OverrideRow
          contentTypes={mockContentTypes}
          overrideItem={overrideToDelete}
          onOverrideChange={mockOnOverrideChange}
          onOverrideDelete={onOverrideDeleteSpy}
          overrideError={mockOverrideError}
          overrides={overrides}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete override/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(onOverrideDeleteSpy).toHaveBeenCalledWith('override-2');
      });
    });
  });

  describe('Content type filtering', () => {
    it('should filter out content types used in other overrides', async () => {
      const user = userEvent.setup();
      const overrideWithBlogPost: Override = {
        id: 'override-1',
        contentTypeId: 'ct-1',
        fieldId: 'title',
      };

      const overrideWithoutContentType: Override = {
        id: 'override-2',
        contentTypeId: '',
        fieldId: '',
      };

      const overrides: Override[] = [overrideWithBlogPost, overrideWithoutContentType];

      render(
        <OverrideRow
          contentTypes={mockContentTypes}
          overrideItem={overrideWithoutContentType}
          onOverrideChange={mockOnOverrideChange}
          onOverrideDelete={mockOnOverrideDelete}
          overrideError={mockOverrideError}
          overrides={overrides}
        />
      );

      const contentTypeInput = screen.getByPlaceholderText('Content type name');
      await user.click(contentTypeInput);

      // Verify Blog Post is NOT in the dropdown (filtered out because override-1 uses it)
      await waitFor(() => {
        const blogPostOptions = screen.queryAllByRole('option', { name: 'Blog Post' });
        expect(blogPostOptions.length).toBe(0);
      });

      // Verify Author is still available
      await waitFor(() => {
        const authorOptions = screen.getAllByRole('option', { name: 'Author' });
        expect(authorOptions.length).toBeGreaterThan(0);
      });
    });

    it('should not filter out current override own content type', async () => {
      const user = userEvent.setup();
      const overrideWithBlogPost: Override = {
        id: 'override-1',
        contentTypeId: 'ct-1',
        fieldId: 'title',
      };

      const overrides: Override[] = [overrideWithBlogPost];

      render(
        <OverrideRow
          contentTypes={mockContentTypes}
          overrideItem={overrideWithBlogPost}
          onOverrideChange={mockOnOverrideChange}
          onOverrideDelete={mockOnOverrideDelete}
          overrideError={mockOverrideError}
          overrides={overrides}
        />
      );

      // Clear and click on content type input to open dropdown
      const contentTypeInput = screen.getByPlaceholderText('Content type name');
      await user.clear(contentTypeInput);
      await user.click(contentTypeInput);

      // Verify Blog Post IS in the dropdown (not filtered out because it's the current override)
      await waitFor(() => {
        const blogPostOptions = screen.getAllByRole('option', { name: 'Blog Post' });
        expect(blogPostOptions.length).toBeGreaterThan(0);
      });

      // Verify Author is also available
      await waitFor(() => {
        const authorOptions = screen.getAllByRole('option', { name: 'Author' });
        expect(authorOptions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty content types array', () => {
      render(
        <OverrideRow
          contentTypes={[]}
          overrideItem={mockOverride}
          onOverrideChange={mockOnOverrideChange}
          onOverrideDelete={mockOnOverrideDelete}
          overrideError={mockOverrideError}
          overrides={[mockOverride]}
        />
      );

      expect(screen.getByLabelText(/content type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/field name/i)).toBeInTheDocument();
    });

    it('should handle content type with no fields', () => {
      const contentTypeWithoutFields: ContentTypeProps = {
        sys: {
          id: 'ct-empty',
          type: 'ContentType',
          version: 1,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
          environment: { sys: { type: 'Link', linkType: 'Environment', id: 'master' } },
        },
        name: 'Empty Content Type',
        description: '',
        displayField: '',
        fields: [],
      };

      const overrideWithEmptyContentType: Override = {
        id: 'override-1',
        contentTypeId: 'ct-empty',
        fieldId: '',
      };

      render(
        <OverrideRow
          contentTypes={[contentTypeWithoutFields]}
          overrideItem={overrideWithEmptyContentType}
          onOverrideChange={mockOnOverrideChange}
          onOverrideDelete={mockOnOverrideDelete}
          overrideError={mockOverrideError}
          overrides={[overrideWithEmptyContentType]}
        />
      );

      const fieldInput = screen.getByPlaceholderText('Field name');
      expect(fieldInput).not.toBeDisabled();
    });
  });

  describe('Field name filtering', () => {
    it('should only show Symbol fields in field name autocomplete', async () => {
      const user = userEvent.setup();
      const overrideWithContentType: Override = {
        id: 'override-1',
        contentTypeId: 'ct-1',
        fieldId: '',
      };

      render(
        <OverrideRow
          contentTypes={mockContentTypes}
          overrideItem={overrideWithContentType}
          onOverrideChange={mockOnOverrideChange}
          onOverrideDelete={mockOnOverrideDelete}
          overrideError={mockOverrideError}
          overrides={[overrideWithContentType]}
        />
      );

      const fieldInput = screen.getByPlaceholderText('Field name');
      expect(fieldInput).not.toBeDisabled();

      await user.click(fieldInput);

      await waitFor(() => {
        // Symbol fields should be available
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Slug')).toBeInTheDocument();
      });

      // Non-Symbol fields (Text and Link types) should NOT be available
      expect(screen.queryByText('Body')).not.toBeInTheDocument();
      expect(screen.queryByText('Author')).not.toBeInTheDocument();
    });
  });
});
