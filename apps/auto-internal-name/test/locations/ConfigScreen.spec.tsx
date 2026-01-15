import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockCma, createMockSdk } from '../mocks';
import ConfigScreen from '../../src/locations/ConfigScreen';
import { ContentTypeProps } from 'contentful-management';

let mockCma: ReturnType<typeof createMockCma>;
let mockSdk: ReturnType<typeof createMockSdk>;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

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

  const simulateSave = async () => {
    const callCount = mockSdk.app.onConfigure.mock.calls.length;
    const onConfigureCallback = mockSdk.app.onConfigure.mock.calls[callCount - 1][0];

    return await act(async () => {
      return await onConfigureCallback();
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCma = createMockCma();
    mockSdk = createMockSdk({
      cma: mockCma,
    });
    mockSdk.app.getParameters.mockResolvedValue(null);
    mockSdk.app.getCurrentState.mockResolvedValue({});
    mockCma.contentType.getMany.mockResolvedValue({
      items: mockContentTypes,
    });
    mockSdk.notifier.error.mockClear();
  });

  describe('Initialization', () => {
    it('should render the component with heading and description', async () => {
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(screen.getByText('Set up Auto-prefix')).toBeInTheDocument();
        expect(
          screen.getByText(
            /This app automatically adds the parent entry's name as a prefix to your reference/
          )
        ).toBeInTheDocument();
      });
    });

    it('should load content types on mount', async () => {
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(mockCma.contentType.getMany).toHaveBeenCalledWith({});
      });
    });

    it('should load existing parameters on mount', async () => {
      const existingParameters = {
        separator: '-',
        rules: [
          {
            id: 'rule-1',
            parentField: {
              fieldUniqueId: 'ct-1.title',
              fieldId: 'title',
              fieldName: 'Title',
              contentTypeId: 'ct-1',
              contentTypeName: 'Blog Post',
              displayName: 'Title | Blog Post',
            },
            referenceField: {
              fieldUniqueId: 'ct-1.slug',
              fieldId: 'slug',
              fieldName: 'Slug',
              contentTypeId: 'ct-1',
              contentTypeName: 'Blog Post',
              displayName: 'Slug | Blog Post',
            },
          },
        ],
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

  describe('Rules management', () => {
    it('should add a new rule when add button is clicked', async () => {
      const user = userEvent.setup();
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add auto-prefix/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add auto-prefix/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getAllByLabelText(/parent field/i).length).toBeGreaterThan(1);
      });
    });
  });

  describe('clicking install button', () => {
    it('should store correct values in installation parameters', async () => {
      const user = userEvent.setup();

      const initialParameters = {
        separator: '-',
        rules: [
          {
            id: 'rule-1',
            parentField: {
              fieldUniqueId: 'ct-1.title',
              fieldId: 'title',
              fieldName: 'Title',
              contentTypeId: 'ct-1',
              contentTypeName: 'Blog Post',
              displayName: 'Title | Blog Post',
            },
            referenceField: {
              fieldUniqueId: 'ct-1.slug',
              fieldId: 'slug',
              fieldName: 'Slug',
              contentTypeId: 'ct-1',
              contentTypeName: 'Blog Post',
              displayName: 'Slug | Blog Post',
            },
          },
        ],
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

      const addButton = screen.getByRole('button', { name: /add auto-prefix/i });
      await user.click(addButton);

      await waitFor(() => {
        const parentFieldInputs = screen.getAllByLabelText(/parent field/i);
        expect(parentFieldInputs.length).toBeGreaterThan(1);
      });

      // Select parent field for the new rule
      const parentFieldInput = screen.getAllByPlaceholderText(
        /field name \| content type name/i
      )[2];
      await user.click(parentFieldInput);
      await user.type(parentFieldInput, 'Name');
      await waitFor(() => {
        const options = screen.getAllByText('Name | Author');
        expect(options.length).toBeGreaterThan(0);
      });
      await user.click(screen.getAllByText('Name | Author')[0]);

      // Select reference field for the new rule
      const referenceFieldInput = screen.getAllByPlaceholderText(
        /field name \| content type name/i
      )[3];
      await user.click(referenceFieldInput);
      await user.type(referenceFieldInput, 'Title');
      await waitFor(() => {
        const options = screen.getAllByText('Title | Author');
        expect(options.length).toBeGreaterThan(0);
      });
      await user.click(screen.getAllByText('Title | Author')[0]);

      const result = await simulateSave();

      // Verify all parameters are correctly stored
      expect(result.parameters).toHaveProperty('separator');
      expect(result.parameters).toHaveProperty('rules');
      expect(Array.isArray(result.parameters.rules)).toBe(true);

      expect(result.parameters.separator).toBe(' | ');
      expect(result.parameters.rules.length).toBeGreaterThan(1);

      const firstRule = result.parameters.rules[0];
      expect(firstRule).toHaveProperty('id');
      expect(firstRule).toHaveProperty('parentField');
      expect(firstRule).toHaveProperty('referenceField');

      expect(result).toHaveProperty('targetState');
      expect(result.targetState).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('should return false and show error when rule fields are missing', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<ConfigScreen />);
      });

      await waitFor(() => {
        expect(mockCma.contentType.getMany).toHaveBeenCalled();
      });

      const separatorInput = screen.getByLabelText(/separator/i);
      await user.type(separatorInput, '-');

      const result = await simulateSave();

      // Should return false and show error
      expect(result).toBe(false);
      expect(mockSdk.notifier.error).toHaveBeenCalledWith('Some fields are missing or invalid');
      await waitFor(() => {
        expect(screen.getByText('Parent field is required')).toBeInTheDocument();
        expect(screen.getByText('Reference entries is required')).toBeInTheDocument();
      });
    });

    it('should return false when multiple validation errors exist', async () => {
      await act(async () => {
        render(<ConfigScreen />);
      });

      await waitFor(() => {
        expect(mockSdk.cma.contentType.getMany).toHaveBeenCalled();
      });

      // Add a new rule but don't fill in the fields
      const user = userEvent.setup();
      const addButton = screen.getByRole('button', { name: /add auto-prefix/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getAllByLabelText(/parent field/i).length).toBeGreaterThan(1);
      });

      const result = await simulateSave();

      // Should return false and show all error messages
      expect(result).toBe(false);
      expect(mockSdk.notifier.error).toHaveBeenCalledWith('Some fields are missing or invalid');
      await waitFor(() => {
        const parentFieldErrors = screen.getAllByText('Parent field is required');
        const referenceFieldErrors = screen.getAllByText('Reference entries is required');
        expect(parentFieldErrors.length).toBeGreaterThan(0);
        expect(referenceFieldErrors.length).toBeGreaterThan(0);
      });
    });

    it('should validate multiple rules correctly', async () => {
      const user = userEvent.setup();
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(mockSdk.cma.contentType.getMany).toHaveBeenCalled();
      });

      const separatorInput = screen.getByLabelText(/separator/i);
      await user.type(separatorInput, '-');

      // Fill in first rule
      const parentFieldInput1 = screen.getAllByPlaceholderText(
        /field name \| content type name/i
      )[0];
      await user.click(parentFieldInput1);
      await user.type(parentFieldInput1, 'Title');
      await waitFor(() => {
        const options = screen.getAllByText('Title | Blog Post');
        expect(options.length).toBeGreaterThan(0);
      });
      await user.click(screen.getAllByText('Title | Blog Post')[0]);

      const referenceFieldInput1 = screen.getAllByPlaceholderText(
        /field name \| content type name/i
      )[1];
      await user.click(referenceFieldInput1);
      await user.type(referenceFieldInput1, 'Slug');
      await waitFor(() => {
        const options = screen.getAllByText('Slug | Blog Post');
        expect(options.length).toBeGreaterThan(0);
      });
      await user.click(screen.getAllByText('Slug | Blog Post')[0]);

      // Add second rule - incomplete (missing reference field)
      const addButton = screen.getByRole('button', { name: /add auto-prefix/i });
      await user.click(addButton);

      await waitFor(() => {
        const parentFieldInputs = screen.getAllByLabelText(/parent field/i);
        expect(parentFieldInputs.length).toEqual(2);
      });

      // Fill in only parent field for second rule
      const parentFieldInput2 = screen.getAllByPlaceholderText(
        /field name \| content type name/i
      )[2];
      await user.click(parentFieldInput2);
      await user.type(parentFieldInput2, 'Name');
      await waitFor(() => {
        const options = screen.getAllByText('Name | Author');
        expect(options.length).toBeGreaterThan(0);
      });
      await user.click(screen.getAllByText('Name | Author')[0]);

      const result = await simulateSave();

      // Should return false because second rule is incomplete
      expect(result).toBe(false);
      expect(mockSdk.notifier.error).toHaveBeenCalledWith('Some fields are missing or invalid');
      await waitFor(() => {
        expect(screen.getByText('Reference entries is required')).toBeInTheDocument();
      });
    });
  });

  describe('Field filtering', () => {
    it('should only show Symbol fields in autocomplete', async () => {
      const user = userEvent.setup();
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(mockSdk.cma.contentType.getMany).toHaveBeenCalled();
      });

      const parentFieldInput = screen.getAllByPlaceholderText(
        /field name \| content type name/i
      )[0];
      await user.click(parentFieldInput);
      await user.type(parentFieldInput, 'T');

      await waitFor(() => {
        // Symbol fields should be available
        expect(screen.getAllByText('Title | Blog Post').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Slug | Blog Post').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Name | Author').length).toBeGreaterThan(0);
      });

      // Non-Symbol fields (Text type) should NOT be available
      expect(screen.queryByText('Body | Blog Post')).not.toBeInTheDocument();
      expect(screen.queryByText('Bio | Author')).not.toBeInTheDocument();
    });
  });
});
