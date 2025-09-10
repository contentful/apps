import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchFilter } from '../../../src/locations/Page/components/SearchFilter';

vi.mock('use-debounce', () => ({
  useDebounce: (value: string, delay: number) => {
    // In tests, we'll return the value immediately for testing purposes
    // unless we specifically want to test debounce behavior
    return [value];
  },
}));

describe('SearchFilter', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    isDisabled: false,
    debounceDelay: 300,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Basic rendering', () => {
    it('renders the search filter component', () => {
      render(<SearchFilter {...defaultProps} />);

      expect(screen.getByText('Search entries')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });

    it('shows the correct initial value', () => {
      const initialQuery = 'test search';
      render(<SearchFilter {...defaultProps} searchQuery={initialQuery} />);

      const input = screen.getByPlaceholderText('Search');
      expect(input).toHaveValue(initialQuery);
    });
  });

  describe('User interactions', () => {
    it('updates input value when user types', () => {
      render(<SearchFilter {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search');
      fireEvent.change(input, { target: { value: 'new search' } });

      expect(input).toHaveValue('new search');
    });

    it('calls onSearchChange when input value changes', async () => {
      const mockOnSearchChange = vi.fn();
      render(<SearchFilter {...defaultProps} onSearchChange={mockOnSearchChange} />);

      const input = screen.getByPlaceholderText('Search');
      fireEvent.change(input, { target: { value: 'test query' } });

      await waitFor(() => {
        expect(mockOnSearchChange).toHaveBeenCalledWith('test query');
      });
    });

    it('handles special characters in search input', async () => {
      const mockOnSearchChange = vi.fn();
      render(<SearchFilter {...defaultProps} onSearchChange={mockOnSearchChange} />);

      const input = screen.getByPlaceholderText('Search');
      const specialQuery = 'test@#$%^&*()_+-=[]{}|;:,.<>?';
      fireEvent.change(input, { target: { value: specialQuery } });

      await waitFor(() => {
        expect(mockOnSearchChange).toHaveBeenCalledWith(specialQuery);
      });
    });
  });

  describe('Disabled state', () => {
    it('disables input when isDisabled is true', () => {
      render(<SearchFilter {...defaultProps} isDisabled={true} />);

      const input = screen.getByPlaceholderText('Search');
      expect(input).toBeDisabled();
    });

    it('enables input when isDisabled is false', () => {
      render(<SearchFilter {...defaultProps} isDisabled={false} />);

      const input = screen.getByPlaceholderText('Search');
      expect(input).not.toBeDisabled();
    });
  });

  describe('Props synchronization', () => {
    it('updates input value when searchQuery prop changes', () => {
      const { rerender } = render(<SearchFilter {...defaultProps} searchQuery="initial" />);

      const input = screen.getByPlaceholderText('Search');
      expect(input).toHaveValue('initial');

      rerender(<SearchFilter {...defaultProps} searchQuery="updated" />);
      expect(input).toHaveValue('updated');
    });

    it('handles searchQuery prop changes from external source', () => {
      const { rerender } = render(<SearchFilter {...defaultProps} searchQuery="" />);

      const input = screen.getByPlaceholderText('Search');

      // Simulate external prop change (e.g., content type change)
      rerender(<SearchFilter {...defaultProps} searchQuery="external change" />);

      expect(input).toHaveValue('external change');
    });
  });

  describe('Edge cases', () => {
    it('handles undefined searchQuery gracefully', () => {
      render(<SearchFilter {...defaultProps} searchQuery={undefined as any} />);

      const input = screen.getByPlaceholderText('Search');
      expect(input).toHaveValue('');
    });

    it('handles very long search queries', async () => {
      const mockOnSearchChange = vi.fn();
      const longQuery = 'a'.repeat(1000);

      render(<SearchFilter {...defaultProps} onSearchChange={mockOnSearchChange} />);

      const input = screen.getByPlaceholderText('Search');
      fireEvent.change(input, { target: { value: longQuery } });

      await waitFor(() => {
        expect(mockOnSearchChange).toHaveBeenCalledWith(longQuery);
      });
    });

    it('handles rapid typing without errors', async () => {
      const mockOnSearchChange = vi.fn();
      render(<SearchFilter {...defaultProps} onSearchChange={mockOnSearchChange} />);

      const input = screen.getByPlaceholderText('Search');

      // Simulate rapid typing
      for (let i = 0; i < 10; i++) {
        fireEvent.change(input, { target: { value: `test${i}` } });
      }

      // Should not throw any errors
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });
  });
});
