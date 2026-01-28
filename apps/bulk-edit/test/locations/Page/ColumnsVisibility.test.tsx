import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { FieldVisibiltyMenu } from '../../../src/locations/Page/components/FieldVisibiltyMenu';
import { ContentTypeField, FilterOption } from '../../../src/locations/Page/types';

// Non-localized fields for basic tests
const mockFields: ContentTypeField[] = [
  {
    contentTypeId: 'testContentType',
    uniqueId: 'displayName',
    id: 'displayName',
    name: 'Display name',
    type: 'Symbol',
    required: true,
    validations: [],
  },
  {
    contentTypeId: 'testContentType',
    uniqueId: 'updatedAt',
    id: 'updatedAt',
    name: 'Updated at',
    type: 'Date',
    required: false,
    validations: [],
  },
];

const mockLocalizedFields: ContentTypeField[] = [
  {
    contentTypeId: 'testContentType',
    uniqueId: 'displayName-en-US',
    id: 'displayName',
    name: 'Display name',
    type: 'Symbol',
    locale: 'en-US',
    required: true,
    validations: [],
  },
  {
    contentTypeId: 'testContentType',
    uniqueId: 'description-en-US',
    id: 'description',
    name: 'Description',
    type: 'Text',
    locale: 'en-US',
    required: false,
    validations: [],
  },
  {
    contentTypeId: 'testContentType',
    uniqueId: 'displayName-es-AR',
    id: 'displayName',
    name: 'Display name',
    type: 'Symbol',
    locale: 'es-AR',
    required: true,
    validations: [],
  },
  {
    contentTypeId: 'testContentType',
    uniqueId: 'description-es-AR',
    id: 'description',
    name: 'Description',
    type: 'Text',
    locale: 'es-AR',
    required: false,
    validations: [],
  },
];

const getFieldsMapped = (fields: ContentTypeField[]): FilterOption[] => {
  return fields.map((field) => ({
    label: field.locale ? `(${field.locale}) ${field.name}` : field.name,
    value: field.uniqueId,
  }));
};

describe('FieldVisibiltyMenu (Column Selection)', () => {
  const defaultProps = {
    selectedColumns: [] as FilterOption[],
    setSelectedColumns: vi.fn(),
    fields: mockFields,
    getFieldsMapped,
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('renders the menu trigger button', async () => {
      render(<FieldVisibiltyMenu {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /filed visibility/i })).toBeInTheDocument();
      });
    });

    it('opens menu when trigger is clicked', async () => {
      render(<FieldVisibiltyMenu {...defaultProps} />);

      const triggerButton = screen.getByRole('button', { name: /filed visibility/i });
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByText('Select all')).toBeInTheDocument();
        expect(screen.getByText('Clear all')).toBeInTheDocument();
      });
    });

    it('displays all field options in the menu', async () => {
      render(<FieldVisibiltyMenu {...defaultProps} />);

      const triggerButton = screen.getByRole('button', { name: /filed visibility/i });
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Display name' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'Updated at' })).toBeInTheDocument();
      });
    });
  });

  describe('Selection functionality', () => {
    it('calls setSelectedColumns with all options when Select all is clicked', async () => {
      render(<FieldVisibiltyMenu {...defaultProps} />);

      const triggerButton = screen.getByRole('button', { name: /filed visibility/i });
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByText('Select all')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select all'));

      expect(defaultProps.setSelectedColumns).toHaveBeenCalledWith(getFieldsMapped(mockFields));
    });

    it('calls setSelectedColumns with empty array when Clear all is clicked', async () => {
      const selectedColumns = getFieldsMapped(mockFields);
      render(<FieldVisibiltyMenu {...defaultProps} selectedColumns={selectedColumns} />);

      const triggerButton = screen.getByRole('button', { name: /filed visibility/i });
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByText('Clear all')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Clear all'));

      expect(defaultProps.setSelectedColumns).toHaveBeenCalledWith([]);
    });

    it('adds field to selection when unselected field is clicked', async () => {
      render(<FieldVisibiltyMenu {...defaultProps} selectedColumns={[]} />);

      const triggerButton = screen.getByRole('button', { name: /filed visibility/i });
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Display name' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('menuitem', { name: 'Display name' }));

      expect(defaultProps.setSelectedColumns).toHaveBeenCalledWith([
        { label: 'Display name', value: 'displayName' },
      ]);
    });

    it('removes field from selection when selected field is clicked', async () => {
      const selectedColumns = [{ label: 'Display name', value: 'displayName' }];
      render(<FieldVisibiltyMenu {...defaultProps} selectedColumns={selectedColumns} />);

      const triggerButton = screen.getByRole('button', { name: /filed visibility/i });
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Display name' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('menuitem', { name: 'Display name' }));

      expect(defaultProps.setSelectedColumns).toHaveBeenCalledWith([]);
    });
  });

  describe('Localization functionality', () => {
    it('renders localized field options correctly', async () => {
      const localizedProps = {
        ...defaultProps,
        fields: mockLocalizedFields,
      };
      render(<FieldVisibiltyMenu {...localizedProps} />);

      const triggerButton = screen.getByRole('button', { name: /filed visibility/i });
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: '(en-US) Display name' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: '(en-US) Description' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: '(es-AR) Display name' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: '(es-AR) Description' })).toBeInTheDocument();
      });
    });

    it('handles selection of localized fields correctly', async () => {
      const localizedProps = {
        ...defaultProps,
        fields: mockLocalizedFields,
        selectedColumns: [],
      };
      render(<FieldVisibiltyMenu {...localizedProps} />);

      const triggerButton = screen.getByRole('button', { name: /filed visibility/i });
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: '(en-US) Display name' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('menuitem', { name: '(en-US) Display name' }));

      expect(defaultProps.setSelectedColumns).toHaveBeenCalledWith([
        { label: '(en-US) Display name', value: 'displayName-en-US' },
      ]);
    });
  });

  describe('Edge cases', () => {
    it('handles empty fields array', async () => {
      const emptyProps = {
        ...defaultProps,
        fields: [],
      };
      render(<FieldVisibiltyMenu {...emptyProps} />);

      const triggerButton = screen.getByRole('button', { name: /filed visibility/i });
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByText('Select all')).toBeInTheDocument();
        expect(screen.getByText('Clear all')).toBeInTheDocument();
      });
    });

    it('handles single field', async () => {
      const singleFieldProps = {
        ...defaultProps,
        fields: [mockFields[0]],
      };
      render(<FieldVisibiltyMenu {...singleFieldProps} />);

      const triggerButton = screen.getByRole('button', { name: /filed visibility/i });
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Display name' })).toBeInTheDocument();
      });
    });
  });
});
