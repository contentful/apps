import { renderHook, cleanup } from '@testing-library/react';
import { act } from 'react';
import { vi } from 'vitest';
import { useKeyboardNavigation } from '../../../../src/locations/Page/hooks/useKeyboardNavigation';
import { HEADERS_ROW } from '../../../../src/locations/Page/utils/constants';

describe('useKeyboardNavigation', () => {
  const mockProps = {
    totalColumns: 3,
    entriesLength: 2,
    onCellAction: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  describe('Initial state', () => {
    it('should initialize with no focused cell', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockProps));

      expect(result.current.focusedCell).toBeNull();
      expect(result.current.selectionRange).toBeNull();
      expect(result.current.isSelecting).toBe(false);
    });

    it('should provide table ref', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockProps));

      expect(result.current.tableRef).toBeDefined();
    });
  });

  describe('focusCell function', () => {
    it('should set focused cell and clear any previous state', async () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockProps));

      act(() => {
        result.current.focusCell({ row: 0, column: 1 });
      });

      expect(result.current.focusedCell).toEqual({ row: 0, column: 1 });
      expect(result.current.selectionRange).toBeNull();
      expect(result.current.isSelecting).toBe(false);

      // Focus a different cell - should update focus
      act(() => {
        result.current.focusCell({ row: 1, column: 2 });
      });

      expect(result.current.focusedCell).toEqual({ row: 1, column: 2 });
      expect(result.current.selectionRange).toBeNull();
      expect(result.current.isSelecting).toBe(false);
    });
  });

  describe('setFocusedCell function', () => {
    it('should allow setting focused cell directly', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockProps));

      act(() => {
        result.current.setFocusedCell({ row: 1, column: 2 });
      });

      expect(result.current.focusedCell).toEqual({ row: 1, column: 2 });
    });

    it('should allow clearing focused cell', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockProps));

      // Set initial focus
      act(() => {
        result.current.setFocusedCell({ row: 1, column: 2 });
      });

      expect(result.current.focusedCell).toEqual({ row: 1, column: 2 });

      // Clear focus
      act(() => {
        result.current.setFocusedCell(null);
      });

      expect(result.current.focusedCell).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty table (no entries)', () => {
      const propsWithNoEntries = {
        ...mockProps,
        entriesLength: 0,
      };

      const { result } = renderHook(() => useKeyboardNavigation(propsWithNoEntries));

      // With no entries, we can still focus on header row
      act(() => {
        result.current.focusCell({ row: HEADERS_ROW, column: 1 });
      });

      expect(result.current.focusedCell).toEqual({ row: HEADERS_ROW, column: 1 });
      expect(result.current.selectionRange).toBeNull();
    });

    it('should handle minimal table (single column, single entry)', () => {
      const minimalProps = {
        ...mockProps,
        totalColumns: 1,
        entriesLength: 1,
      };

      const { result } = renderHook(() => useKeyboardNavigation(minimalProps));

      act(() => {
        result.current.focusCell({ row: 0, column: 0 });
      });

      expect(result.current.focusedCell).toEqual({ row: 0, column: 0 });
      expect(result.current.selectionRange).toBeNull();
      expect(result.current.isSelecting).toBe(false);
    });
  });

  describe('Callback integration', () => {
    it('should work with onCellAction callback', () => {
      const onCellAction = vi.fn();
      const propsWithCallback = {
        ...mockProps,
        onCellAction,
      };

      const { result } = renderHook(() => useKeyboardNavigation(propsWithCallback));

      // Should initialize normally
      expect(result.current.focusedCell).toBeNull();
      expect(result.current.selectionRange).toBeNull();
      expect(result.current.isSelecting).toBe(false);

      // Should allow normal operations
      act(() => {
        result.current.focusCell({ row: 0, column: 0 });
      });

      expect(result.current.focusedCell).toEqual({ row: 0, column: 0 });
      // Note: onCellAction is called through keyboard events, not focusCell
    });

    it('should work when onCellAction is not provided', () => {
      const propsWithoutCallback = {
        totalColumns: 3,
        entriesLength: 2,
      };

      const { result } = renderHook(() => useKeyboardNavigation(propsWithoutCallback));

      // Should initialize without errors
      expect(result.current.focusedCell).toBeNull();
      expect(result.current.selectionRange).toBeNull();
      expect(result.current.isSelecting).toBe(false);

      // Should allow normal operations
      act(() => {
        result.current.focusCell({ row: 0, column: 0 });
      });

      expect(result.current.focusedCell).toEqual({ row: 0, column: 0 });
    });
  });

  describe('Keyboard event handling', () => {
    it('should handle arrow key navigation', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockProps));

      // Mock table element
      const mockTableElement = document.createElement('table');
      Object.defineProperty(result.current.tableRef, 'current', {
        value: mockTableElement,
        writable: true,
      });

      // Set initial focus
      act(() => {
        result.current.focusCell({ row: 0, column: 1 });
      });

      // Test arrow down
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
        mockTableElement.dispatchEvent(event);
      });

      expect(result.current.focusedCell).toEqual({ row: 1, column: 1 });

      // Test arrow right
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
        mockTableElement.dispatchEvent(event);
      });

      expect(result.current.focusedCell).toEqual({ row: 1, column: 2 });

      // Test arrow up
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
        mockTableElement.dispatchEvent(event);
      });

      expect(result.current.focusedCell).toEqual({ row: 0, column: 2 });

      // Test arrow left
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
        mockTableElement.dispatchEvent(event);
      });

      expect(result.current.focusedCell).toEqual({ row: 0, column: 1 });
    });

    it('should handle Enter key to trigger cell action', () => {
      const onCellAction = vi.fn();
      const propsWithCallback = {
        ...mockProps,
        onCellAction,
      };

      const { result } = renderHook(() => useKeyboardNavigation(propsWithCallback));

      // Mock table element
      const mockTableElement = document.createElement('table');
      Object.defineProperty(result.current.tableRef, 'current', {
        value: mockTableElement,
        writable: true,
      });

      // Set initial focus
      act(() => {
        result.current.focusCell({ row: 0, column: 1 });
      });

      // Press Enter
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        mockTableElement.dispatchEvent(event);
      });

      expect(onCellAction).toHaveBeenCalledWith(0, 1);
      // Should move focus down after Enter
      expect(result.current.focusedCell).toEqual({ row: 1, column: 1 });
    });

    it('should handle Space key to trigger cell action', () => {
      const onCellAction = vi.fn();
      const propsWithCallback = {
        ...mockProps,
        onCellAction,
      };

      const { result } = renderHook(() => useKeyboardNavigation(propsWithCallback));

      // Mock table element
      const mockTableElement = document.createElement('table');
      Object.defineProperty(result.current.tableRef, 'current', {
        value: mockTableElement,
        writable: true,
      });

      // Set initial focus
      act(() => {
        result.current.focusCell({ row: 1, column: 2 });
      });

      // Press Space
      act(() => {
        const event = new KeyboardEvent('keydown', { key: ' ' });
        mockTableElement.dispatchEvent(event);
      });

      expect(onCellAction).toHaveBeenCalledWith(1, 2);
    });

    it('should handle Escape key to clear focus', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockProps));

      // Mock table element
      const mockTableElement = document.createElement('table');
      Object.defineProperty(result.current.tableRef, 'current', {
        value: mockTableElement,
        writable: true,
      });

      // Set initial focus
      act(() => {
        result.current.focusCell({ row: 1, column: 1 });
      });

      expect(result.current.focusedCell).toEqual({ row: 1, column: 1 });

      // Press Escape
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        mockTableElement.dispatchEvent(event);
      });

      expect(result.current.focusedCell).toBeNull();
    });

    it('should handle Shift+Enter to move focus up', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockProps));

      // Mock table element
      const mockTableElement = document.createElement('table');
      Object.defineProperty(result.current.tableRef, 'current', {
        value: mockTableElement,
        writable: true,
      });

      // Set initial focus
      act(() => {
        result.current.focusCell({ row: 1, column: 1 });
      });

      // Press Shift+Enter
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'Enter',
          shiftKey: true,
        });
        mockTableElement.dispatchEvent(event);
      });

      expect(result.current.focusedCell).toEqual({ row: 0, column: 1 });
    });

    it('should respect table boundaries', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockProps));

      // Set focus at top-left corner
      act(() => {
        result.current.focusCell({ row: -1, column: 0 }); // HEADERS_ROW
      });

      // Try to go up (should stay at header row)
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
        result.current.tableRef.current?.dispatchEvent(event);
      });

      expect(result.current.focusedCell).toEqual({ row: -1, column: 0 });

      // Try to go left (should stay at first column)
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
        result.current.tableRef.current?.dispatchEvent(event);
      });

      expect(result.current.focusedCell).toEqual({ row: -1, column: 0 });

      // Set focus at bottom-right corner
      act(() => {
        result.current.focusCell({ row: 1, column: 2 }); // Last row, last column
      });

      // Try to go down (should stay at last row)
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
        result.current.tableRef.current?.dispatchEvent(event);
      });

      expect(result.current.focusedCell).toEqual({ row: 1, column: 2 });

      // Try to go right (should stay at last column)
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
        result.current.tableRef.current?.dispatchEvent(event);
      });

      expect(result.current.focusedCell).toEqual({ row: 1, column: 2 });
    });
  });
});
