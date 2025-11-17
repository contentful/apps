import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import ConfigScreen from '../../src/locations/ConfigScreen';
import { ContentTypeProps } from 'contentful-management';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

// Mock crypto.randomUUID
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
  configurable: true,
  writable: true,
});

describe('ConfigScreen', () => {
  const mockContentTypes: ContentTypeProps[] = [
    {
      sys: { id: 'ct-1', type: 'ContentType' },
      name: 'Blog Post',
      fields: [
        { id: 'title', name: 'Title', type: 'Symbol', required: false },
        { id: 'slug', name: 'Slug', type: 'Symbol', required: false },
        { id: 'body', name: 'Body', type: 'Text', required: false },
      ],
    } as ContentTypeProps,
    {
      sys: { id: 'ct-2', type: 'ContentType' },
      name: 'Author',
      fields: [
        { id: 'name', name: 'Name', type: 'Symbol', required: false },
        { id: 'title', name: 'Title', type: 'Symbol', required: false },
        { id: 'bio', name: 'Bio', type: 'Text', required: false },
      ],
    } as ContentTypeProps,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.app.getParameters.mockResolvedValue(null);
    mockSdk.app.getCurrentState.mockResolvedValue({});
    mockSdk.cma.contentType.getMany.mockResolvedValue({
      items: mockContentTypes,
    });
    mockSdk.notifier.error.mockClear();
  });

  describe('Initialization', () => {
    it('should render the component with heading and description', async () => {
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(screen.getByText('Set up Auto Internal Name')).toBeInTheDocument();
        expect(
          screen.getByText(
            /This app allows you to automatically set the name of an entry based on a field from its parent entry/
          )
        ).toBeInTheDocument();
      });
    });

    it('should load content types on mount', async () => {
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(mockSdk.cma.contentType.getMany).toHaveBeenCalledWith({
          spaceId: 'test-space',
          environmentId: 'test-environment',
        });
      });
    });

    it('should load existing parameters on mount', async () => {
      const existingParameters = {
        separator: '-',
        sourceFieldId: 'title',
        overrides: [{ id: 'override-1', contentTypeId: 'ct-1', fieldName: 'slug' }],
      };

      mockSdk.app.getParameters.mockResolvedValue(existingParameters);

      render(<ConfigScreen />);

      await waitFor(() => {
        expect(mockSdk.app.getParameters).toHaveBeenCalled();
        expect(mockSdk.app.setReady).toHaveBeenCalled();
      });
    });
  });

  describe('Input changes', () => {
    it('should update separator value when input changes', async () => {
      const user = userEvent.setup();
      render(<ConfigScreen />);

      await waitFor(() => {
        const separatorInput = screen.getByLabelText(/separator/i);
        expect(separatorInput).toBeInTheDocument();
      });

      const separatorInput = screen.getByLabelText(/separator/i);
      await user.clear(separatorInput);
      await user.type(separatorInput, '-');

      expect(separatorInput).toHaveValue('-');
    });
  });

  describe('Overrides management', () => {
    it('should display add override button', async () => {
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add override/i })).toBeInTheDocument();
      });
    });

    it('should add a new override when add button is clicked', async () => {
      const user = userEvent.setup();
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add override/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add override/i });
      await user.click(addButton);

      // Should render OverrideItem component
      await waitFor(() => {
        expect(screen.getByLabelText(/content type/i)).toBeInTheDocument();
      });
    });

    it('should disable add override button when all content types are used', async () => {
      const user = userEvent.setup();
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(mockSdk.cma.contentType.getMany).toHaveBeenCalled();
      });

      // Add first override and select Blog Post
      const addButton = screen.getByRole('button', { name: /add override/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/content type/i)).toBeInTheDocument();
      });

      const contentTypeAutocomplete = screen.getAllByPlaceholderText(/content type name/i)[0];
      await user.type(contentTypeAutocomplete, 'Blog Post');
      const blogPostOption = await screen.findByText('Blog Post');
      await user.click(blogPostOption);

      // Add second override and select Author
      await user.click(addButton);

      await waitFor(() => {
        const contentTypeInputs = screen.getAllByPlaceholderText(/content type name/i);
        expect(contentTypeInputs.length).toBe(2);
      });

      const secondContentTypeAutocomplete = screen.getAllByPlaceholderText(/content type name/i)[1];
      await user.type(secondContentTypeAutocomplete, 'Author');
      const authorOption = screen.getAllByRole('option', { name: 'Author' })[0];
      await user.click(authorOption);

      // Verify button is disabled
      await waitFor(() => {
        const addButtonAfter = screen.getByRole('button', { name: /add override/i });
        expect(addButtonAfter).toBeDisabled();
      });
    });

    it('should disable add override button when overrides count >= content types count', async () => {
      const user = userEvent.setup();
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(mockSdk.cma.contentType.getMany).toHaveBeenCalled();
      });

      // Add first override
      const addButton = screen.getByRole('button', { name: /add override/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/content type/i)).toBeInTheDocument();
      });

      // Add second override (even without selecting content types)
      await user.click(addButton);

      await waitFor(() => {
        const contentTypeInputs = screen.getAllByPlaceholderText(/content type name/i);
        expect(contentTypeInputs.length).toBe(2);
      });

      // Verify button is disabled (2 overrides >= 2 content types)
      await waitFor(() => {
        const addButtonAfter = screen.getByRole('button', { name: /add override/i });
        expect(addButtonAfter).toBeDisabled();
      });
    });

    it('should show tooltip when max overrides reached', async () => {
      const user = userEvent.setup();
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(mockSdk.cma.contentType.getMany).toHaveBeenCalled();
      });

      // Add first override and select Blog Post
      const addButton = screen.getByRole('button', { name: /add override/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/content type/i)).toBeInTheDocument();
      });

      const contentTypeAutocomplete = screen.getAllByPlaceholderText(/content type name/i)[0];
      await user.type(contentTypeAutocomplete, 'Blog Post');
      const blogPostOption = await screen.findByText('Blog Post');
      await user.click(blogPostOption);

      // Add second override and select Author
      await user.click(addButton);

      await waitFor(() => {
        const contentTypeInputs = screen.getAllByPlaceholderText(/content type name/i);
        expect(contentTypeInputs.length).toBe(2);
      });

      const secondContentTypeAutocomplete = screen.getAllByPlaceholderText(/content type name/i)[1];
      await user.type(secondContentTypeAutocomplete, 'Author');
      const authorOption = screen.getAllByRole('option', { name: 'Author' })[0];
      await user.click(authorOption);

      const disabledButton = screen.getByRole('button', { name: /add override/i });
      const tooltipWrapper = disabledButton.parentElement;
      if (tooltipWrapper) {
        fireEvent.mouseEnter(tooltipWrapper);
      }

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip.textContent).toBe('No more content types available.');
      });
    });
  });

  describe('clicking install button', () => {
    it('should store correct values in installation parameters', async () => {
      const user = userEvent.setup();

      const initialParameters = {
        separator: '-',
        sourceFieldId: 'title',
        overrides: [{ id: 'override-1', contentTypeId: 'ct-1', fieldId: 'slug' }],
      };

      mockSdk.app.getParameters.mockResolvedValue(initialParameters);

      render(<ConfigScreen />);

      await waitFor(() => {
        expect(screen.getByLabelText(/separator/i)).toBeInTheDocument();
      });

      const separatorInput = screen.getByLabelText(/separator/i);
      await waitFor(() => {
        expect(separatorInput).toHaveValue('-');
      });

      await user.clear(separatorInput);
      await user.type(separatorInput, ' | ');

      await waitFor(() => {
        expect(separatorInput).toHaveValue(' | ');
      });

      const addButton = screen.getByRole('button', { name: /add override/i });
      await user.click(addButton);

      await waitFor(() => {
        const overrideItems = screen.getAllByLabelText(/content type/i);
        expect(overrideItems.length).toBeGreaterThan(1);
      });

      const contentTypeAutocomplete = screen.getAllByPlaceholderText(/content type name/i)[1];
      await user.type(contentTypeAutocomplete, 'Author');
      const authorOption = screen.getAllByRole('option', { name: 'Author' })[0];
      await user.click(authorOption);

      await waitFor(() => {
        const fieldAutocomplete = screen.getAllByPlaceholderText(/field name/i)[1];
        expect(fieldAutocomplete).not.toBeDisabled();
      });

      const fieldAutocomplete = screen.getAllByPlaceholderText(/field name/i)[1];
      await user.type(fieldAutocomplete, 'Name');
      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Name'));

      // Get the latest callback (last one registered) - this simulates clicking install
      const callCount = mockSdk.app.onConfigure.mock.calls.length;
      const onConfigureCallback = mockSdk.app.onConfigure.mock.calls[callCount - 1][0];

      const result = await onConfigureCallback();

      // Verify all parameters are correctly stored
      expect(result.parameters).toHaveProperty('separator');
      expect(result.parameters).toHaveProperty('sourceFieldId');
      expect(result.parameters).toHaveProperty('overrides');
      expect(Array.isArray(result.parameters.overrides)).toBe(true);

      expect(result.parameters.separator).toBe(' | ');
      expect(result.parameters.sourceFieldId).toBe('title');
      expect(result.parameters.overrides.length).toBeGreaterThan(1);

      const firstOverride = result.parameters.overrides[0];
      expect(firstOverride).toHaveProperty('id');
      expect(firstOverride).toHaveProperty('contentTypeId');
      expect(firstOverride).toHaveProperty('fieldId');
      expect(firstOverride.contentTypeId).toBe('ct-1');
      expect(firstOverride.fieldId).toBe('slug');

      expect(result).toHaveProperty('targetState');
      expect(result.targetState).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('should return false and show error when override fieldId is missing', async () => {
      const user = userEvent.setup();
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(mockSdk.cma.contentType.getMany).toHaveBeenCalled();
      });

      const separatorInput = screen.getByLabelText(/separator/i);
      await user.type(separatorInput, '-');

      const sourceFieldAutocomplete = screen.getByPlaceholderText(/search field name/i);
      await user.type(sourceFieldAutocomplete, 'Title');

      const addButton = screen.getByRole('button', { name: /add override/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/content type/i)).toBeInTheDocument();
      });

      const contentTypeAutocomplete = screen.getAllByPlaceholderText(/content type name/i)[0];
      await user.type(contentTypeAutocomplete, 'Blog Post');

      const callCount = mockSdk.app.onConfigure.mock.calls.length;
      const onConfigureCallback = mockSdk.app.onConfigure.mock.calls[callCount - 1][0];
      const result = await onConfigureCallback();

      // Should return false and show error
      expect(result).toBe(false);
      expect(mockSdk.notifier.error).toHaveBeenCalledWith('Some fields are missing or invalid');
      expect(await screen.findByText('Field name is required')).toBeInTheDocument();
    });

    it('should return false when multiple validation errors exist', async () => {
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(mockSdk.cma.contentType.getMany).toHaveBeenCalled();
      });

      // Leave sourceFieldId empty, and add an incomplete override
      const user = userEvent.setup();
      const addButton = screen.getByRole('button', { name: /add override/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/content type/i)).toBeInTheDocument();
      });

      const callCount = mockSdk.app.onConfigure.mock.calls.length;
      const onConfigureCallback = mockSdk.app.onConfigure.mock.calls[callCount - 1][0];
      const result = await onConfigureCallback();

      // Should return false and show all error messages
      expect(result).toBe(false);
      expect(mockSdk.notifier.error).toHaveBeenCalledWith('Some fields are missing or invalid');
      expect(await screen.findByText('Source field ID is required')).toBeInTheDocument();
      expect(await screen.findByText('Content type is required')).toBeInTheDocument();
    });

    it('should validate multiple overrides correctly', async () => {
      const user = userEvent.setup();
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(mockSdk.cma.contentType.getMany).toHaveBeenCalled();
      });

      const separatorInput = screen.getByLabelText(/separator/i);
      await user.type(separatorInput, '-');

      const sourceFieldAutocomplete = screen.getByPlaceholderText(/search field name/i);
      await user.type(sourceFieldAutocomplete, 'Title');

      // Add first override - complete
      const addButton = screen.getByRole('button', { name: /add override/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/content type/i)).toBeInTheDocument();
      });

      let contentTypeAutocomplete = screen.getAllByPlaceholderText(/content type name/i)[0];
      await user.type(contentTypeAutocomplete, 'Blog Post');

      await waitFor(() => {
        const fieldAutocomplete = screen.getAllByPlaceholderText(/field name/i)[0];
        expect(fieldAutocomplete).not.toBeDisabled();
      });

      await user.type(screen.getAllByPlaceholderText(/field name/i)[0], 'Slug');

      // Add second override - incomplete (missing fieldId)
      await user.click(addButton);

      await waitFor(() => {
        const contentTypeInputs = screen.getAllByPlaceholderText(/content type name/i);
        expect(contentTypeInputs.length).toBe(2);
      });

      contentTypeAutocomplete = screen.getAllByPlaceholderText(/content type name/i)[1];
      await user.type(contentTypeAutocomplete, 'Author');
      const authorOption = screen.getAllByRole('option', { name: 'Author' })[0];
      await user.click(authorOption);

      // Don't select field for second override

      const callCount = mockSdk.app.onConfigure.mock.calls.length;
      const onConfigureCallback = mockSdk.app.onConfigure.mock.calls[callCount - 1][0];
      const result = await onConfigureCallback();

      // Should return false because second override is incomplete
      expect(result).toBe(false);
      expect(mockSdk.notifier.error).toHaveBeenCalledWith('Some fields are missing or invalid');
      expect((await screen.findAllByText('Field name is required')).length).toBe(2);
    });
  });

  describe('Source field filtering', () => {
    it('should only show Symbol fields in sourceFieldId autocomplete', async () => {
      const user = userEvent.setup();
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(mockSdk.cma.contentType.getMany).toHaveBeenCalled();
      });

      const sourceFieldAutocomplete = screen.getByPlaceholderText(/search field name/i);
      await user.click(sourceFieldAutocomplete);

      await waitFor(() => {
        // Symbol fields should be available
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Slug')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
      });

      // Non-Symbol fields (Text type) should NOT be available
      expect(screen.queryByText('Body')).not.toBeInTheDocument();
      expect(screen.queryByText('Bio')).not.toBeInTheDocument();
    });
  });
});
