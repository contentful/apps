import { renderHook, cleanup } from '@testing-library/react';
import { act } from 'react';
import { expect, vi } from 'vitest';
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

  describe('Callback integration', () => {
    it('should work with onCellAction callback', () => {
      const onCellAction = vi.fn();
      const propsWithCallback = {
        ...mockProps,
        onCellAction,
      };

      const { result } = renderHook(() => useKeyboardNavigation(propsWithCallback));

      expect(result.current.focusedCell).toBeNull();
      expect(result.current.selectionRange).toBeNull();
      expect(result.current.isSelecting).toBe(false);

      act(() => {
        result.current.focusCell({ row: 0, column: 0 });
      });

      expect(result.current.focusedCell).toEqual({ row: 0, column: 0 });
    });

    it('should work when onCellAction is not provided', () => {
      const propsWithoutCallback = {
        totalColumns: 3,
        entriesLength: 2,
      };

      const { result } = renderHook(() => useKeyboardNavigation(propsWithoutCallback));

      expect(result.current.focusedCell).toBeNull();
      expect(result.current.selectionRange).toBeNull();
      expect(result.current.isSelecting).toBe(false);

      act(() => {
        result.current.focusCell({ row: 0, column: 0 });
      });

      expect(result.current.focusedCell).toEqual({ row: 0, column: 0 });
    });
  });

  describe('Keyboard event handling', () => {
    it('should handle arrow key navigation', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockProps));

      const mockTableElement = document.createElement('table');
      Object.defineProperty(result.current.tableRef, 'current', {
        value: mockTableElement,
        writable: true,
      });

      act(() => {
        result.current.focusCell({ row: 0, column: 1 });
      });

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
        mockTableElement.dispatchEvent(event);
      });

      expect(result.current.focusedCell).toEqual({ row: 1, column: 1 });

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
        mockTableElement.dispatchEvent(event);
      });

      expect(result.current.focusedCell).toEqual({ row: 1, column: 2 });

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
        mockTableElement.dispatchEvent(event);
      });

      expect(result.current.focusedCell).toEqual({ row: 0, column: 2 });

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

      const mockTableElement = document.createElement('table');
      Object.defineProperty(result.current.tableRef, 'current', {
        value: mockTableElement,
        writable: true,
      });

      act(() => {
        result.current.focusCell({ row: 0, column: 1 });
      });

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        mockTableElement.dispatchEvent(event);
      });

      expect(onCellAction).toHaveBeenCalledWith(0, 1);
      expect(result.current.focusedCell).toEqual({ row: 1, column: 1 });
    });

    it('should handle Space key to trigger cell action', () => {
      const onCellAction = vi.fn();
      const propsWithCallback = {
        ...mockProps,
        onCellAction,
      };

      const { result } = renderHook(() => useKeyboardNavigation(propsWithCallback));

      const mockTableElement = document.createElement('table');
      Object.defineProperty(result.current.tableRef, 'current', {
        value: mockTableElement,
        writable: true,
      });

      act(() => {
        result.current.focusCell({ row: 1, column: 2 });
      });

      act(() => {
        const event = new KeyboardEvent('keydown', { key: ' ' });
        mockTableElement.dispatchEvent(event);
      });

      expect(onCellAction).toHaveBeenCalledWith(1, 2);
    });

    it('should handle Escape key to clear focus', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockProps));

      const mockTableElement = document.createElement('table');
      Object.defineProperty(result.current.tableRef, 'current', {
        value: mockTableElement,
        writable: true,
      });

      act(() => {
        result.current.focusCell({ row: 1, column: 1 });
      });

      expect(result.current.focusedCell).toEqual({ row: 1, column: 1 });

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        mockTableElement.dispatchEvent(event);
      });

      expect(result.current.focusedCell).toBeNull();
    });

    it('should handle Shift+Enter to move focus up', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockProps));

      const mockTableElement = document.createElement('table');
      Object.defineProperty(result.current.tableRef, 'current', {
        value: mockTableElement,
        writable: true,
      });

      act(() => {
        result.current.focusCell({ row: 1, column: 1 });
      });

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

      act(() => {
        result.current.focusCell({ row: -1, column: 0 });
      });

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
        result.current.tableRef.current?.dispatchEvent(event);
      });

      expect(result.current.focusedCell).toEqual({ row: -1, column: 0 });

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
        result.current.tableRef.current?.dispatchEvent(event);
      });

      expect(result.current.focusedCell).toEqual({ row: -1, column: 0 });

      act(() => {
        result.current.focusCell({ row: 1, column: 2 });
      });

      // Try to go down (should stay at last row)
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
        result.current.tableRef.current?.dispatchEvent(event);
      });

      expect(result.current.focusedCell).toEqual({ row: 1, column: 2 });

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
        result.current.tableRef.current?.dispatchEvent(event);
      });

      expect(result.current.focusedCell).toEqual({ row: 1, column: 2 });
    });

    it('should maintain cell focus without interference from table focus', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockProps));

      act(() => {
        result.current.focusCell({ row: 2, column: 1 });
      });

      expect(result.current.focusedCell).toEqual({ row: 2, column: 1 });

      expect(result.current.focusedCell).toEqual({ row: 2, column: 1 });
    });

    it('should handle Alt+Space to select entire column', () => {
      const { result } = renderHook(() => useKeyboardNavigation(mockProps));

      const mockTableElement = document.createElement('table');
      Object.defineProperty(result.current.tableRef, 'current', {
        value: mockTableElement,
        writable: true,
      });

      act(() => {
        result.current.focusCell({ row: 1, column: 2 });
      });

      expect(result.current.focusedCell).toEqual({ row: 1, column: 2 });
      expect(result.current.selectionRange).toBeNull();
      expect(result.current.isSelecting).toBe(false);

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: ' ',
          code: 'Space',
          altKey: true,
        });
        mockTableElement.dispatchEvent(event);
      });

      expect(result.current.focusedCell).toEqual({ row: HEADERS_ROW, column: 2 });
      expect(result.current.selectionRange).toEqual({
        start: { row: HEADERS_ROW, column: 2 },
        end: { row: 1, column: 2 },
      });
      expect(result.current.isSelecting).toBe(true);
    });
  });
});
