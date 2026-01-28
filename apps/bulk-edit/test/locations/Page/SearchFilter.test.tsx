import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchBar } from '../../../src/locations/Page/components/SearchBar';
import { ContentTypeField, FieldFilterValue } from '../../../src/locations/Page/types';

vi.mock('use-debounce', () => ({
  useDebounce: (value: string, delay: number) => {
    // In tests, we'll return the value immediately for testing purposes
    // unless we specifically want to test debounce behavior
    return [value];
  },
}));

// Mock the SDK for FieldFilter component
vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => ({
    dialogs: {
      selectSingleEntry: vi.fn(),
      selectMultipleEntries: vi.fn(),
      selectSingleAsset: vi.fn(),
      selectMultipleAssets: vi.fn(),
    },
  }),
}));

describe('SearchFilter', () => {
  const mockFields: ContentTypeField[] = [
    {
      contentTypeId: 'testContentType',
      uniqueId: 'field-1',
      id: 'title',
      name: 'Title',
      type: 'Symbol',
      locale: 'en-US',
      required: true,
      validations: [],
    },
    {
      contentTypeId: 'testContentType',
      uniqueId: 'field-2',
      id: 'description',
      name: 'Description',
      type: 'Text',
      locale: 'en-US',
      required: false,
      validations: [],
    },
    {
      contentTypeId: 'testContentType',
      uniqueId: 'field-3',
      id: 'count',
      name: 'Count',
      type: 'Integer',
      locale: 'en-US',
      required: false,
      validations: [],
    },
  ];

  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    isDisabled: false,
    debounceDelay: 300,

    fields: mockFields,
    fieldFilterValues: [] as FieldFilterValue[],
    setFieldFilterValues: vi.fn(),
    statusOptions: [],
    selectedStatuses: [],
    setSelectedStatuses: vi.fn(),
    clearSelectionState: vi.fn(),
    setActivePage: vi.fn(),
    resetFilters: vi.fn(),
    hasActiveFilters: () => false,
    sortOption: 'newest',
    setSortOption: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Basic rendering', () => {
    it('renders the search filter component', () => {
      render(<SearchBar {...defaultProps} />);

      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
      expect(screen.getByText('Fields')).toBeInTheDocument();
      expect(screen.getByText('Reset filters')).toBeInTheDocument();
      expect(screen.getByText('Sort by')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('shows the correct initial value', () => {
      const initialQuery = 'test search';
      render(<SearchBar {...defaultProps} searchQuery={initialQuery} />);

      const input = screen.getByPlaceholderText('Search');
      expect(input).toHaveValue(initialQuery);
    });
  });

  describe('User interactions', () => {
    it('updates input value when user types', () => {
      render(<SearchBar {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search');
      fireEvent.change(input, { target: { value: 'new search' } });

      expect(input).toHaveValue('new search');
    });

    it('calls onSearchChange when input value changes', async () => {
      const mockOnSearchChange = vi.fn();
      render(<SearchBar {...defaultProps} onSearchChange={mockOnSearchChange} />);

      const input = screen.getByPlaceholderText('Search');
      fireEvent.change(input, { target: { value: 'test query' } });

      await waitFor(() => {
        expect(mockOnSearchChange).toHaveBeenCalledWith('test query', []);
      });
    });

    it('handles special characters in search input', async () => {
      const mockOnSearchChange = vi.fn();
      render(<SearchBar {...defaultProps} onSearchChange={mockOnSearchChange} />);

      const input = screen.getByPlaceholderText('Search');
      const specialQuery = 'test@#$%^&*()_+-=[]{}|;:,.<>?';
      fireEvent.change(input, { target: { value: specialQuery } });

      await waitFor(() => {
        expect(mockOnSearchChange).toHaveBeenCalledWith(specialQuery, []);
      });
    });
  });

  describe('Disabled state', () => {
    it('disables input when isDisabled is true', () => {
      render(<SearchBar {...defaultProps} isDisabled={true} />);

      const input = screen.getByPlaceholderText('Search');
      expect(input).toBeDisabled();
    });

    it('enables input when isDisabled is false', () => {
      render(<SearchBar {...defaultProps} isDisabled={false} />);

      const input = screen.getByPlaceholderText('Search');
      expect(input).not.toBeDisabled();
    });
  });

  describe('Props synchronization', () => {
    it('updates input value when searchQuery prop changes', () => {
      const { rerender } = render(<SearchBar {...defaultProps} searchQuery="initial" />);

      const input = screen.getByPlaceholderText('Search');
      expect(input).toHaveValue('initial');

      rerender(<SearchBar {...defaultProps} searchQuery="updated" />);
      expect(input).toHaveValue('updated');
    });

    it('handles searchQuery prop changes from external source', () => {
      const { rerender } = render(<SearchBar {...defaultProps} searchQuery="" />);

      const input = screen.getByPlaceholderText('Search');

      // Simulate external prop change (e.g., content type change)
      rerender(<SearchBar {...defaultProps} searchQuery="external change" />);

      expect(input).toHaveValue('external change');
    });
  });

  describe('Edge cases', () => {
    it('handles undefined searchQuery gracefully', () => {
      render(<SearchBar {...defaultProps} searchQuery={undefined as any} />);

      const input = screen.getByPlaceholderText('Search');
      expect(input).toHaveValue('');
    });

    it('handles very long search queries', async () => {
      const mockOnSearchChange = vi.fn();
      const longQuery = 'a'.repeat(1000);

      render(<SearchBar {...defaultProps} onSearchChange={mockOnSearchChange} />);

      const input = screen.getByPlaceholderText('Search');
      fireEvent.change(input, { target: { value: longQuery } });

      await waitFor(() => {
        expect(mockOnSearchChange).toHaveBeenCalledWith(longQuery, []);
      });
    });

    it('handles rapid typing without errors', async () => {
      const mockOnSearchChange = vi.fn();
      render(<SearchBar {...defaultProps} onSearchChange={mockOnSearchChange} />);

      const input = screen.getByPlaceholderText('Search');

      // Simulate rapid typing
      for (let i = 0; i < 10; i++) {
        fireEvent.change(input, { target: { value: `test${i}` } });
      }

      // Should not throw any errors
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });

    it('should handle pure numeric search queries like "3"', async () => {
      const mockOnSearchChange = vi.fn();
      render(<SearchBar {...defaultProps} onSearchChange={mockOnSearchChange} />);

      const input = screen.getByPlaceholderText('Search');

      // Test searching for pure number "3"
      fireEvent.change(input, { target: { value: '3' } });

      await waitFor(() => {
        expect(mockOnSearchChange).toHaveBeenCalledWith('3', []);
      });
    });
  });

  describe('Fields dropdown menu', () => {
    it('opens fields menu when clicking Fields button', async () => {
      render(<SearchBar {...defaultProps} />);

      const fieldsButton = screen.getByText('Fields');
      fireEvent.click(fieldsButton);

      await waitFor(() => {
        expect(screen.getByText('Clear all')).toBeInTheDocument();
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Count')).toBeInTheDocument();
      });
    });

    it('calls setFieldFilterValues when selecting a field', async () => {
      const mockSetFieldFilterValues = vi.fn();
      render(<SearchBar {...defaultProps} setFieldFilterValues={mockSetFieldFilterValues} />);

      const fieldsButton = screen.getByText('Fields');
      fireEvent.click(fieldsButton);

      await waitFor(() => {
        expect(screen.getByText('Title')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Title'));

      expect(mockSetFieldFilterValues).toHaveBeenCalledWith([
        {
          fieldUniqueId: 'field-1',
          operator: 'in',
          value: '',
          contentTypeField: mockFields[0],
        },
      ]);
    });

    it('removes field from fieldFilterValues when deselecting', async () => {
      const existingFilter: FieldFilterValue = {
        fieldUniqueId: 'field-1',
        operator: 'in',
        value: '',
        contentTypeField: mockFields[0],
      };
      const mockSetFieldFilterValues = vi.fn();

      render(
        <SearchBar
          {...defaultProps}
          fieldFilterValues={[existingFilter]}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      const fieldsButton = screen.getByText('Fields');
      fireEvent.click(fieldsButton);

      // Wait for menu to open - use menuitem role to target the menu item specifically
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Title' })).toBeInTheDocument();
      });

      // Click the menu item (not the FieldFilter component which also shows "Title")
      fireEvent.click(screen.getByRole('menuitem', { name: 'Title' }));

      expect(mockSetFieldFilterValues).toHaveBeenCalledWith([]);
    });

    it('clears all field filters when clicking Clear all', async () => {
      const existingFilters: FieldFilterValue[] = [
        {
          fieldUniqueId: 'field-1',
          operator: 'in',
          value: '',
          contentTypeField: mockFields[0],
        },
        {
          fieldUniqueId: 'field-2',
          operator: 'in',
          value: '',
          contentTypeField: mockFields[1],
        },
      ];
      const mockSetFieldFilterValues = vi.fn();

      render(
        <SearchBar
          {...defaultProps}
          fieldFilterValues={existingFilters}
          setFieldFilterValues={mockSetFieldFilterValues}
        />
      );

      const fieldsButton = screen.getByText('Fields');
      fireEvent.click(fieldsButton);

      await waitFor(() => {
        expect(screen.getByText('Clear all')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Clear all'));

      expect(mockSetFieldFilterValues).toHaveBeenCalledWith([]);
    });
  });

  describe('FieldFilter rendering', () => {
    it('renders FieldFilter components for each active filter', () => {
      const activeFilters: FieldFilterValue[] = [
        {
          fieldUniqueId: 'field-1',
          operator: 'in',
          value: 'test',
          contentTypeField: mockFields[0],
        },
        {
          fieldUniqueId: 'field-2',
          operator: 'in',
          value: '',
          contentTypeField: mockFields[1],
        },
      ];

      render(<SearchBar {...defaultProps} fieldFilterValues={activeFilters} />);

      // FieldFilter displays the field name - check for rendered field names
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('does not render FieldFilter when no filters are active', () => {
      render(<SearchBar {...defaultProps} fieldFilterValues={[]} />);

      // When no filters, field names shouldn't appear in the filter list area
      // Note: Field names may appear in the dropdown menu, so we check the filter container is empty
      const container = document.querySelector('.css-1jv49k2'); // fieldFilterListContainer
      expect(container?.children.length || 0).toBe(0);
    });
  });

  describe('Reset filters button', () => {
    it('calls resetFilters when clicked', () => {
      const mockResetFilters = vi.fn();
      render(
        <SearchBar
          {...defaultProps}
          resetFilters={mockResetFilters}
          hasActiveFilters={() => true}
        />
      );

      const resetButton = screen.getByRole('button', { name: /reset filters/i });
      fireEvent.click(resetButton);

      expect(mockResetFilters).toHaveBeenCalled();
    });

    it('is disabled when no filters are active', () => {
      render(<SearchBar {...defaultProps} hasActiveFilters={() => false} />);

      const resetButton = screen.getByRole('button', { name: /reset filters/i });
      expect(resetButton).toBeDisabled();
    });

    it('is enabled when filters are active', () => {
      render(<SearchBar {...defaultProps} hasActiveFilters={() => true} />);

      const resetButton = screen.getByRole('button', { name: /reset filters/i });
      expect(resetButton).not.toBeDisabled();
    });

    it('is disabled when isDisabled prop is true', () => {
      render(<SearchBar {...defaultProps} isDisabled={true} hasActiveFilters={() => true} />);

      const resetButton = screen.getByRole('button', { name: /reset filters/i });
      expect(resetButton).toBeDisabled();
    });
  });

  describe('Sort menu', () => {
    it('calls setSortOption and setActivePage when sort option is selected', async () => {
      const mockSetSortOption = vi.fn();
      const mockSetActivePage = vi.fn();

      render(
        <SearchBar
          {...defaultProps}
          setSortOption={mockSetSortOption}
          setActivePage={mockSetActivePage}
        />
      );

      // Open the sort menu
      const sortButton = screen.getByRole('button', { name: /sort by/i });
      fireEvent.click(sortButton);

      // Wait for menu to open and click an option
      await waitFor(() => {
        expect(screen.getByText('Updated: oldest')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Updated: oldest'));

      expect(mockSetSortOption).toHaveBeenCalledWith('updatedAt_asc');
      expect(mockSetActivePage).toHaveBeenCalledWith(0);
    });

    it('is disabled when isDisabled prop is true', () => {
      render(<SearchBar {...defaultProps} isDisabled={true} />);

      const sortButton = screen.getByRole('button', { name: /sort by/i });
      expect(sortButton).toBeDisabled();
    });
  });

  describe('onSearchChange with fieldFilterValues', () => {
    it('passes fieldFilterValues to onSearchChange callback', async () => {
      const mockOnSearchChange = vi.fn();
      const activeFilters: FieldFilterValue[] = [
        {
          fieldUniqueId: 'field-1',
          operator: 'in',
          value: 'test',
          contentTypeField: mockFields[0],
        },
      ];

      render(
        <SearchBar
          {...defaultProps}
          onSearchChange={mockOnSearchChange}
          fieldFilterValues={activeFilters}
        />
      );

      const input = screen.getByPlaceholderText('Search');
      fireEvent.change(input, { target: { value: 'query' } });

      await waitFor(() => {
        expect(mockOnSearchChange).toHaveBeenCalledWith('query', activeFilters);
      });
    });
  });
});
