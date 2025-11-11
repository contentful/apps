import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import OverrideRow from '../../src/components/OverrideRow';
import { ContentTypeProps } from 'contentful-management';
import { Override } from '../../src/utils/consts';

describe('OverrideRow', () => {
  const mockContentTypes: ContentTypeProps[] = [
    {
      sys: { id: 'ct-1', type: 'ContentType' },
      name: 'Blog Post',
      fields: [
        { id: 'title', name: 'Title', type: 'Symbol', required: false },
        { id: 'slug', name: 'Slug', type: 'Symbol', required: false },
        { id: 'author', name: 'Author', type: 'Link', required: false },
      ],
    } as ContentTypeProps,
    {
      sys: { id: 'ct-2', type: 'ContentType' },
      name: 'Author',
      fields: [
        { id: 'name', name: 'Name', type: 'Symbol', required: false },
        { id: 'email', name: 'Email', type: 'Symbol', required: false },
      ],
    } as ContentTypeProps,
  ];

  const mockOverride: Override = {
    id: 'override-1',
    contentTypeId: '',
    fieldName: '',
  };

  const mockSetOverrides = vi.fn((updater) => {
    if (typeof updater === 'function') {
      return updater([mockOverride]);
    }
    return updater;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component with content type and field inputs', () => {
      render(
        <OverrideRow
          contentTypes={mockContentTypes}
          overrideItem={mockOverride}
          setOverrides={mockSetOverrides}
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
          setOverrides={mockSetOverrides}
        />
      );

      const fieldInput = screen.getByPlaceholderText('Field name');
      expect(fieldInput).toBeDisabled();
    });
  });

  describe('Content type selection', () => {
    it('should update override when content type is selected', async () => {
      const user = userEvent.setup();
      const setOverridesSpy = vi.fn();

      render(
        <OverrideRow
          contentTypes={mockContentTypes}
          overrideItem={mockOverride}
          setOverrides={setOverridesSpy}
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
        expect(setOverridesSpy).toHaveBeenCalled();
      });
    });

    it('should clear field selection when content type changes', async () => {
      const user = userEvent.setup();
      const overrideWithContentType: Override = {
        id: 'override-1',
        contentTypeId: 'ct-1',
        fieldName: 'title',
      };

      const setOverridesSpy = vi.fn();

      render(
        <OverrideRow
          contentTypes={mockContentTypes}
          overrideItem={overrideWithContentType}
          setOverrides={setOverridesSpy}
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

      // Verify that the function was called and check the result from the selection call (last call)
      const lastCallIndex = setOverridesSpy.mock.calls.length - 1;
      const callArgs = setOverridesSpy.mock.calls[lastCallIndex][0];
      expect(callArgs([overrideWithContentType])[0]).toEqual({
        id: 'override-1',
        contentTypeId: 'ct-2',
        fieldName: '',
      });
    });

    it('should reset fields when content type input is cleared', async () => {
      const user = userEvent.setup();
      const overrideWithContentType: Override = {
        id: 'override-1',
        contentTypeId: 'ct-1',
        fieldName: 'title',
      };

      const setOverridesSpy = vi.fn();

      render(
        <OverrideRow
          contentTypes={mockContentTypes}
          overrideItem={overrideWithContentType}
          setOverrides={setOverridesSpy}
        />
      );

      const contentTypeInput = screen.getByPlaceholderText('Content type name');

      await user.clear(contentTypeInput);
      await user.click(contentTypeInput);
      const option = screen.getAllByRole('option', { name: 'Blog Post' })[0] as HTMLElement;
      await user.click(option);

      await waitFor(() => {
        expect(contentTypeInput).toHaveValue('Blog Post');
      });

      await user.clear(contentTypeInput);

      await waitFor(() => {
        expect(contentTypeInput).toHaveValue('');
        expect(setOverridesSpy).toHaveBeenCalled();
      });

      // Verify that the function was called and check the result from the selection call (last call)
      const lastCallIndex = setOverridesSpy.mock.calls.length - 1;
      const callArgs = setOverridesSpy.mock.calls[lastCallIndex][0];
      expect(callArgs([overrideWithContentType])[0]).toEqual({
        id: 'override-1',
        contentTypeId: '',
        fieldName: '',
      });
    });
  });

  describe('Field selection', () => {
    it('should enable field input when content type is selected', async () => {
      const overrideWithContentType: Override = {
        id: 'override-1',
        contentTypeId: 'ct-1',
        fieldName: '',
      };

      render(
        <OverrideRow
          contentTypes={mockContentTypes}
          overrideItem={overrideWithContentType}
          setOverrides={mockSetOverrides}
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
        fieldName: '',
      };

      const setOverridesSpy = vi.fn((updater) => {
        if (typeof updater === 'function') {
          return updater([overrideWithContentType]);
        }
        return updater;
      });

      render(
        <OverrideRow
          contentTypes={mockContentTypes}
          overrideItem={overrideWithContentType}
          setOverrides={setOverridesSpy}
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
        expect(setOverridesSpy).toHaveBeenCalled();
      });

      // Verify that the function was called and check the result
      const lastCallIndex = setOverridesSpy.mock.calls.length - 1;
      const callArgs = setOverridesSpy.mock.calls[lastCallIndex][0];
      expect(callArgs([overrideWithContentType])[0]).toEqual({
        id: 'override-1',
        contentTypeId: 'ct-2',
        fieldName: 'Name',
      });
    });
  });

  describe('Delete functionality', () => {
    it('should call setOverrides with filtered array when delete is clicked', async () => {
      const user = userEvent.setup();
      const overrides: Override[] = [
        mockOverride,
        { id: 'override-2', contentTypeId: 'ct-1', fieldName: 'title' },
      ];

      const setOverridesSpy = vi.fn((updater) => {
        if (typeof updater === 'function') {
          return updater(overrides);
        }
        return updater;
      });

      render(
        <OverrideRow
          contentTypes={mockContentTypes}
          overrideItem={mockOverride}
          setOverrides={setOverridesSpy}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete override/i });
      await user.click(deleteButton);

      // Should filter out the current override
      await waitFor(() => {
        expect(setOverridesSpy).toHaveBeenCalled();
        const callArgs = setOverridesSpy.mock.calls[0][0];
        if (typeof callArgs === 'function') {
          const result = callArgs(overrides);
          expect(result).toHaveLength(1);
          expect(result[0].id).toBe('override-2');
        }
      });
    });

    it('should remove only the specific override when delete is clicked', async () => {
      const user = userEvent.setup();
      const overrides: Override[] = [
        { id: 'override-1', contentTypeId: 'ct-1', fieldName: 'title' },
        { id: 'override-2', contentTypeId: 'ct-2', fieldName: 'name' },
        { id: 'override-3', contentTypeId: 'ct-1', fieldName: 'slug' },
      ];

      const setOverridesSpy = vi.fn((updater) => {
        if (typeof updater === 'function') {
          return updater(overrides);
        }
        return updater;
      });

      const overrideToDelete = overrides[1];

      render(
        <OverrideRow
          contentTypes={mockContentTypes}
          overrideItem={overrideToDelete}
          setOverrides={setOverridesSpy}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete override/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(setOverridesSpy).toHaveBeenCalled();
        const callArgs = setOverridesSpy.mock.calls[0][0];
        if (typeof callArgs === 'function') {
          const result = callArgs(overrides);
          expect(result).toHaveLength(2);
          expect(result.find((o: Override) => o.id === 'override-2')).toBeUndefined();
          expect(result.find((o: Override) => o.id === 'override-1')).toBeDefined();
          expect(result.find((o: Override) => o.id === 'override-3')).toBeDefined();
        }
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty content types array', () => {
      render(
        <OverrideRow
          contentTypes={[]}
          overrideItem={mockOverride}
          setOverrides={mockSetOverrides}
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
        fieldName: '',
      };

      render(
        <OverrideRow
          contentTypes={[contentTypeWithoutFields]}
          overrideItem={overrideWithEmptyContentType}
          setOverrides={mockSetOverrides}
        />
      );

      const fieldInput = screen.getByPlaceholderText('Field name');
      expect(fieldInput).not.toBeDisabled();
    });
  });
});
