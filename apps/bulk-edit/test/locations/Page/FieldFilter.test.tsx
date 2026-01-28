import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { FieldFilter } from '../../../src/locations/Page/components/FieldFilter';
import { ContentTypeField, FieldFilterValue } from '../../../src/locations/Page/types';

// Mock useDebounce to return value immediately in tests
vi.mock('use-debounce', () => ({
  useDebounce: (value: string) => [value],
}));

// Mock SDK
const mockSdk = {
  locales: {
    default: 'en-US',
    available: ['en-US'],
  },
  dialogs: {
    selectSingleEntry: vi.fn(),
    selectMultipleEntries: vi.fn(),
    selectSingleAsset: vi.fn(),
    selectMultipleAssets: vi.fn(),
  },
};

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('FieldFilter', () => {
  const mockSetFieldFilterValues = vi.fn();

  // Helper to create different field types
  const createContentTypeField = (name: string = 'Title'): ContentTypeField => ({
    contentTypeId: 'testContentType',
    uniqueId: 'title-en-US',
    id: 'title',
    name,
    type: 'Symbol',
    required: false,
    validations: [],
  });

  const createLongTextField = (name: string = 'Description'): ContentTypeField => ({
    contentTypeId: 'testContentType',
    uniqueId: 'description-en-US',
    id: 'description',
    name,
    type: 'Text',
    required: false,
    validations: [],
  });

  const createNumberField = (name: string = 'Count'): ContentTypeField => ({
    contentTypeId: 'testContentType',
    uniqueId: 'count-en-US',
    id: 'count',
    name,
    type: 'Number',
    required: false,
    validations: [],
  });

  const createIntegerField = (name: string = 'Quantity'): ContentTypeField => ({
    contentTypeId: 'testContentType',
    uniqueId: 'quantity-en-US',
    id: 'quantity',
    name,
    type: 'Integer',
    required: false,
    validations: [],
  });

  const createSingleEntryField = (name: string = 'Related Entry'): ContentTypeField => ({
    contentTypeId: 'testContentType',
    uniqueId: 'relatedEntry-en-US',
    id: 'relatedEntry',
    name,
    type: 'Link',
    required: false,
    validations: [{ linkContentType: ['blogPost', 'article'] }],
    fieldControl: { fieldId: 'relatedEntry', widgetId: 'entryLinkEditor' },
  });

  const createMultipleEntriesField = (name: string = 'Related Entries'): ContentTypeField => ({
    contentTypeId: 'testContentType',
    uniqueId: 'relatedEntries-en-US',
    id: 'relatedEntries',
    name,
    type: 'Array',
    required: false,
    validations: [{ linkContentType: ['blogPost', 'article'] }],
    fieldControl: { fieldId: 'relatedEntries', widgetId: 'entryLinksEditor' },
    items: { type: 'Link', linkType: 'Entry' },
  });

  const createSingleAssetField = (name: string = 'Image'): ContentTypeField => ({
    contentTypeId: 'testContentType',
    uniqueId: 'image-en-US',
    id: 'image',
    name,
    type: 'Link',
    required: false,
    validations: [],
    fieldControl: { fieldId: 'image', widgetId: 'assetLinkEditor' },
  });

  const createMultipleAssetsField = (name: string = 'Gallery'): ContentTypeField => ({
    contentTypeId: 'testContentType',
    uniqueId: 'gallery-en-US',
    id: 'gallery',
    name,
    type: 'Array',
    required: false,
    validations: [],
    fieldControl: { fieldId: 'gallery', widgetId: 'assetLinksEditor' },
    items: { type: 'Link', linkType: 'Asset' },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Basic rendering', () => {
    it('renders field name', () => {
      render(
        <FieldFilter
          field={createContentTypeField('Title')}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('renders default operator label', () => {
      render(
        <FieldFilter
          field={createContentTypeField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      expect(screen.getByText('is')).toBeInTheDocument();
    });

    it('renders text input for text fields', () => {
      render(
        <FieldFilter
          field={createContentTypeField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(
        <FieldFilter
          field={createContentTypeField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      expect(document.getElementById('closeButton')).toBeInTheDocument();
    });
  });

  describe('Text field (Symbol) operators', () => {
    it('shows correct operators for text fields', async () => {
      render(
        <FieldFilter
          field={createContentTypeField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      // Click operator dropdown
      fireEvent.click(screen.getByText('is'));

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'is' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'is not' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'matches' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'is not empty' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'is empty' })).toBeInTheDocument();
      });
    });

    it('updates operator when selecting a different one', async () => {
      render(
        <FieldFilter
          field={createContentTypeField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      fireEvent.click(screen.getByText('is'));

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'matches' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('menuitem', { name: 'matches' }));

      // The operator label should update
      await waitFor(() => {
        expect(screen.getByText('matches')).toBeInTheDocument();
      });
    });

    it('hides input when "is empty" is selected', async () => {
      render(
        <FieldFilter
          field={createContentTypeField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      // Initially input is visible
      expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();

      fireEvent.click(screen.getByText('is'));

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'is empty' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('menuitem', { name: 'is empty' }));

      // Input should be hidden
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Enter value')).not.toBeInTheDocument();
      });
    });
  });

  describe('Number field operators', () => {
    it('shows correct operators for number fields', async () => {
      render(
        <FieldFilter field={createNumberField()} setFieldFilterValues={mockSetFieldFilterValues} />
      );

      fireEvent.click(screen.getByText('is'));

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'is' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'is not' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'is less than' })).toBeInTheDocument();
        expect(
          screen.getByRole('menuitem', { name: 'is less than or equal to' })
        ).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'is greater than' })).toBeInTheDocument();
        expect(
          screen.getByRole('menuitem', { name: 'is greater than or equal to' })
        ).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'is not empty' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'is empty' })).toBeInTheDocument();
      });
    });

    it('shows correct operators for integer fields', async () => {
      render(
        <FieldFilter field={createIntegerField()} setFieldFilterValues={mockSetFieldFilterValues} />
      );

      fireEvent.click(screen.getByText('is'));

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'is less than' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'is greater than' })).toBeInTheDocument();
      });
    });
  });

  describe('Single Entry link field', () => {
    it('shows "Select Entry" button instead of text input', () => {
      render(
        <FieldFilter
          field={createSingleEntryField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      expect(screen.getByText('Select Entry')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Enter value')).not.toBeInTheDocument();
    });

    it('shows Link operators for entry fields', async () => {
      render(
        <FieldFilter
          field={createSingleEntryField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      fireEvent.click(screen.getByText('is'));

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'is' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'is not' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'is not empty' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'is empty' })).toBeInTheDocument();
        // 'matches' should NOT be available for Link fields
        expect(screen.queryByRole('menuitem', { name: 'matches' })).not.toBeInTheDocument();
      });
    });

    it('calls selectSingleEntry dialog when button is clicked', async () => {
      mockSdk.dialogs.selectSingleEntry.mockResolvedValue({
        sys: { id: 'entry-123' },
      });

      render(
        <FieldFilter
          field={createSingleEntryField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      fireEvent.click(screen.getByText('Select Entry'));

      await waitFor(() => {
        expect(mockSdk.dialogs.selectSingleEntry).toHaveBeenCalledWith({
          locale: 'en-US',
          contentTypes: ['blogPost', 'article'],
        });
      });
    });

    it('displays truncated entry ID after selection', async () => {
      mockSdk.dialogs.selectSingleEntry.mockResolvedValue({
        sys: { id: 'entry-123-long-id' },
      });

      render(
        <FieldFilter
          field={createSingleEntryField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      fireEvent.click(screen.getByText('Select Entry'));

      await waitFor(() => {
        expect(screen.getByText('entry-12...')).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Entries link field', () => {
    it('shows "Select Entries" button', () => {
      render(
        <FieldFilter
          field={createMultipleEntriesField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      expect(screen.getByText('Select Entries')).toBeInTheDocument();
    });

    it('shows Array operators for entry array fields', async () => {
      render(
        <FieldFilter
          field={createMultipleEntriesField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      fireEvent.click(screen.getByText('include one of'));

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'include one of' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: "don't include" })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'include all of' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'is not empty' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'is empty' })).toBeInTheDocument();
      });
    });

    it('calls selectMultipleEntries dialog when button is clicked', async () => {
      mockSdk.dialogs.selectMultipleEntries.mockResolvedValue([
        { sys: { id: 'entry-1' } },
        { sys: { id: 'entry-2' } },
      ]);

      render(
        <FieldFilter
          field={createMultipleEntriesField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      fireEvent.click(screen.getByText('Select Entries'));

      await waitFor(() => {
        expect(mockSdk.dialogs.selectMultipleEntries).toHaveBeenCalledWith({
          locale: 'en-US',
          contentTypes: ['blogPost', 'article'],
        });
      });
    });

    it('displays count after multiple entries selection', async () => {
      mockSdk.dialogs.selectMultipleEntries.mockResolvedValue([
        { sys: { id: 'entry-1' } },
        { sys: { id: 'entry-2' } },
        { sys: { id: 'entry-3' } },
      ]);

      render(
        <FieldFilter
          field={createMultipleEntriesField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      fireEvent.click(screen.getByText('Select Entries'));

      await waitFor(() => {
        expect(screen.getByText('3 Entries selected')).toBeInTheDocument();
      });
    });
  });

  describe('Single Asset link field', () => {
    it('shows "Select Asset" button', () => {
      render(
        <FieldFilter
          field={createSingleAssetField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      expect(screen.getByText('Select Asset')).toBeInTheDocument();
    });

    it('calls selectSingleAsset dialog when button is clicked', async () => {
      mockSdk.dialogs.selectSingleAsset.mockResolvedValue({
        sys: { id: 'asset-123' },
      });

      render(
        <FieldFilter
          field={createSingleAssetField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      fireEvent.click(screen.getByText('Select Asset'));

      await waitFor(() => {
        expect(mockSdk.dialogs.selectSingleAsset).toHaveBeenCalledWith({
          locale: 'en-US',
        });
      });
    });

    it('displays truncated asset ID after selection', async () => {
      mockSdk.dialogs.selectSingleAsset.mockResolvedValue({
        sys: { id: 'asset-456-long-id' },
      });

      render(
        <FieldFilter
          field={createSingleAssetField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      fireEvent.click(screen.getByText('Select Asset'));

      await waitFor(() => {
        expect(screen.getByText('asset-45...')).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Assets link field', () => {
    it('shows "Select Assets" button', () => {
      render(
        <FieldFilter
          field={createMultipleAssetsField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      expect(screen.getByText('Select Assets')).toBeInTheDocument();
    });

    it('calls selectMultipleAssets dialog when button is clicked', async () => {
      mockSdk.dialogs.selectMultipleAssets.mockResolvedValue([
        { sys: { id: 'asset-1' } },
        { sys: { id: 'asset-2' } },
      ]);

      render(
        <FieldFilter
          field={createMultipleAssetsField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      fireEvent.click(screen.getByText('Select Assets'));

      await waitFor(() => {
        expect(mockSdk.dialogs.selectMultipleAssets).toHaveBeenCalledWith({
          locale: 'en-US',
        });
      });
    });

    it('displays count after multiple assets selection', async () => {
      mockSdk.dialogs.selectMultipleAssets.mockResolvedValue([
        { sys: { id: 'asset-1' } },
        { sys: { id: 'asset-2' } },
      ]);

      render(
        <FieldFilter
          field={createMultipleAssetsField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      fireEvent.click(screen.getByText('Select Assets'));

      await waitFor(() => {
        expect(screen.getByText('2 Assets selected')).toBeInTheDocument();
      });
    });
  });

  describe('Filter value updates', () => {
    it('calls setFieldFilterValues when input value changes', async () => {
      render(
        <FieldFilter
          field={createContentTypeField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      const input = screen.getByPlaceholderText('Enter value');
      fireEvent.change(input, { target: { value: 'test value' } });

      await waitFor(() => {
        expect(mockSetFieldFilterValues).toHaveBeenCalled();
      });
    });

    it('calls setFieldFilterValues when operator changes', async () => {
      render(
        <FieldFilter
          field={createContentTypeField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      fireEvent.click(screen.getByText('is'));

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'is not' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('menuitem', { name: 'is not' }));

      await waitFor(() => {
        expect(mockSetFieldFilterValues).toHaveBeenCalled();
      });
    });
  });

  describe('Remove filter', () => {
    it('removes filter when close button is clicked', async () => {
      const field = createContentTypeField();
      render(<FieldFilter field={field} setFieldFilterValues={mockSetFieldFilterValues} />);

      const closeButton = document.getElementById('closeButton');
      expect(closeButton).toBeInTheDocument();

      // Find and click the XIcon inside the close button
      const xIcon = closeButton?.querySelector('svg');
      expect(xIcon).toBeInTheDocument();
      fireEvent.click(xIcon!);

      await waitFor(() => {
        expect(mockSetFieldFilterValues).toHaveBeenCalled();
        // Verify it was called with a function that filters out the field
        const lastCall =
          mockSetFieldFilterValues.mock.calls[mockSetFieldFilterValues.mock.calls.length - 1];
        const filterFn = lastCall[0];
        if (typeof filterFn === 'function') {
          const testFilters: FieldFilterValue[] = [
            {
              fieldUniqueId: field.uniqueId,
              operator: 'in',
              value: 'test',
              contentTypeField: field,
            },
            {
              fieldUniqueId: 'other-field',
              operator: 'in',
              value: 'other',
              contentTypeField: createLongTextField(),
            },
          ];
          const result = filterFn(testFilters);
          expect(result).toHaveLength(1);
          expect(result[0].fieldUniqueId).toBe('other-field');
        }
      });
    });
  });

  describe('Edge cases', () => {
    it('handles dialog cancellation for single entry', async () => {
      mockSdk.dialogs.selectSingleEntry.mockResolvedValue(null);

      render(
        <FieldFilter
          field={createSingleEntryField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      fireEvent.click(screen.getByText('Select Entry'));

      await waitFor(() => {
        expect(mockSdk.dialogs.selectSingleEntry).toHaveBeenCalled();
      });

      // Button should still show "Select Entry" (not updated)
      expect(screen.getByText('Select Entry')).toBeInTheDocument();
    });

    it('handles dialog error for single asset', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSdk.dialogs.selectSingleAsset.mockRejectedValue(new Error('Dialog error'));

      render(
        <FieldFilter
          field={createSingleAssetField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      fireEvent.click(screen.getByText('Select Asset'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error selecting asset:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('handles empty entries array from dialog', async () => {
      mockSdk.dialogs.selectMultipleEntries.mockResolvedValue([]);

      render(
        <FieldFilter
          field={createMultipleEntriesField()}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      fireEvent.click(screen.getByText('Select Entries'));

      await waitFor(() => {
        expect(mockSdk.dialogs.selectMultipleEntries).toHaveBeenCalled();
      });

      // Button should still show "Select Entries" (not updated)
      expect(screen.getByText('Select Entries')).toBeInTheDocument();
    });
  });
});
