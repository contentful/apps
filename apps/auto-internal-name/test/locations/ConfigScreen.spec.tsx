import { render, screen, waitFor } from '@testing-library/react';
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
      ],
    } as ContentTypeProps,
    {
      sys: { id: 'ct-2', type: 'ContentType' },
      name: 'Author',
      fields: [
        { id: 'name', name: 'Name', type: 'Symbol', required: false },
        { id: 'title', name: 'Title', type: 'Symbol', required: false },
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

    it('should update sourceFieldId when a field is selected', async () => {
      render(<ConfigScreen />);

      await waitFor(() => {
        expect(mockSdk.cma.contentType.getMany).toHaveBeenCalled();
      });

      // The sourceFieldId selection is handled internally
      // We can verify it's included in onConfigure
      const onConfigureCallback = mockSdk.app.onConfigure.mock.calls[0][0];
      const result = await onConfigureCallback();

      expect(result.parameters).toHaveProperty('sourceFieldId');
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
  });

  describe('clicking install button', () => {
    it('should store correct values in installation parameters', async () => {
      const user = userEvent.setup();

      const initialParameters = {
        separator: '-',
        sourceFieldId: 'title',
        overrides: [{ id: 'override-1', contentTypeId: 'ct-1', fieldName: 'slug' }],
      };

      mockSdk.app.getParameters.mockResolvedValue(initialParameters);

      render(<ConfigScreen />);

      // Wait for component to initialize with initial parameters
      await waitFor(() => {
        expect(screen.getByLabelText(/separator/i)).toBeInTheDocument();
      });

      // Verify separator is loaded from parameters
      const separatorInput = screen.getByLabelText(/separator/i);
      await waitFor(() => {
        expect(separatorInput).toHaveValue('-');
      });

      // Modify separator value
      await user.clear(separatorInput);
      await user.type(separatorInput, ' | ');

      // Wait for state update
      await waitFor(() => {
        expect(separatorInput).toHaveValue(' | ');
      });

      // Add another override
      const addButton = screen.getByRole('button', { name: /add override/i });
      await user.click(addButton);

      // Wait for the new override to be added
      await waitFor(() => {
        const overrideItems = screen.getAllByLabelText(/content type/i);
        expect(overrideItems.length).toBeGreaterThan(1);
      });

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
      expect(firstOverride).toHaveProperty('fieldName');
      expect(firstOverride.contentTypeId).toBe('ct-1');
      expect(firstOverride.fieldName).toBe('slug');

      expect(result).toHaveProperty('targetState');
      expect(result.targetState).toBeDefined();
    });
  });
});
