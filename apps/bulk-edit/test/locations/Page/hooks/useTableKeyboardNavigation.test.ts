import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTableKeyboardNavigation } from '../../../../src/locations/Page/hooks/useTableKeyboardNavigation';

// Mock DOM methods
const mockFocus = vi.fn();
const mockQuerySelector = vi.fn();
const mockQuerySelectorAll = vi.fn();

// Mock HTMLElement
const mockElement = {
  focus: mockFocus,
  querySelector: mockQuerySelector,
  querySelectorAll: mockQuerySelectorAll,
} as unknown as HTMLElement;

// Mock table structure
const mockTable = {
  querySelectorAll: mockQuerySelectorAll,
} as unknown as HTMLTableElement;

describe('useTableKeyboardNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    mockQuerySelectorAll.mockImplementation((selector: string) => {
      if (selector === 'tr') {
        // Return 3 rows (header + 2 data rows)
        return [
          {
            querySelectorAll: (cellSelector: string) => {
              if (cellSelector === 'td, th') {
                return [
                  { querySelector: () => mockElement },
                  { querySelector: () => mockElement },
                  { querySelector: () => mockElement },
                  { querySelector: () => mockElement },
                ];
              }
              return [];
            },
          }, // header row
          {
            querySelectorAll: (cellSelector: string) => {
              if (cellSelector === 'td, th') {
                return [
                  { querySelector: () => mockElement },
                  { querySelector: () => mockElement },
                  { querySelector: () => mockElement },
                  { querySelector: () => mockElement },
                ];
              }
              return [];
            },
          }, // data row 1
          {
            querySelectorAll: (cellSelector: string) => {
              if (cellSelector === 'td, th') {
                return [
                  { querySelector: () => mockElement },
                  { querySelector: () => mockElement },
                  { querySelector: () => mockElement },
                  { querySelector: () => mockElement },
                ];
              }
              return [];
            },
          }, // data row 2
        ];
      }
      return [];
    });
  });

  it('should initialize with no focused cell', () => {
    const { result } = renderHook(() =>
      useTableKeyboardNavigation({
        totalRows: 3,
        totalColumns: 4,
        onToggleCheckbox: vi.fn(),
        onGetFocusableElement: () => mockElement,
      })
    );

    expect(result.current.focusedCell).toBeNull();
    expect(result.current.tableRef.current).toBeNull();
  });

  it('should focus a cell when focusCell is called', () => {
    const { result } = renderHook(() =>
      useTableKeyboardNavigation({
        totalRows: 3,
        totalColumns: 4,
        onToggleCheckbox: vi.fn(),
        onGetFocusableElement: () => mockElement,
      })
    );

    // Mock the table ref
    result.current.tableRef.current = mockTable;

    act(() => {
      result.current.focusCell(1, 2);
    });

    expect(mockFocus).toHaveBeenCalled();
    expect(result.current.focusedCell).toEqual({ rowIndex: 1, columnIndex: 2 });
  });

  it('should handle arrow key navigation', () => {
    const { result } = renderHook(() =>
      useTableKeyboardNavigation({
        totalRows: 3,
        totalColumns: 4,
        onToggleCheckbox: vi.fn(),
        onGetFocusableElement: () => mockElement,
      })
    );

    // Mock the table ref and set initial focus
    result.current.tableRef.current = mockTable;
    act(() => {
      result.current.focusCell(1, 1);
    });

    // Test arrow down
    const arrowDownEvent = {
      key: 'ArrowDown',
      preventDefault: vi.fn(),
      ctrlKey: false,
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(arrowDownEvent);
    });

    expect(arrowDownEvent.preventDefault).toHaveBeenCalled();
    expect(result.current.focusedCell).toEqual({ rowIndex: 2, columnIndex: 1 });

    // Test arrow up
    const arrowUpEvent = {
      key: 'ArrowUp',
      preventDefault: vi.fn(),
      ctrlKey: false,
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(arrowUpEvent);
    });

    expect(arrowUpEvent.preventDefault).toHaveBeenCalled();
    expect(result.current.focusedCell).toEqual({ rowIndex: 1, columnIndex: 1 });

    // Test arrow right
    const arrowRightEvent = {
      key: 'ArrowRight',
      preventDefault: vi.fn(),
      ctrlKey: false,
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(arrowRightEvent);
    });

    expect(arrowRightEvent.preventDefault).toHaveBeenCalled();
    expect(result.current.focusedCell).toEqual({ rowIndex: 1, columnIndex: 2 });

    // Test arrow left
    const arrowLeftEvent = {
      key: 'ArrowLeft',
      preventDefault: vi.fn(),
      ctrlKey: false,
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(arrowLeftEvent);
    });

    expect(arrowLeftEvent.preventDefault).toHaveBeenCalled();
    expect(result.current.focusedCell).toEqual({ rowIndex: 1, columnIndex: 1 });
  });

  it('should handle Home and End key navigation', () => {
    const { result } = renderHook(() =>
      useTableKeyboardNavigation({
        totalRows: 3,
        totalColumns: 4,
        onToggleCheckbox: vi.fn(),
        onGetFocusableElement: () => mockElement,
      })
    );

    // Mock the table ref and set initial focus
    result.current.tableRef.current = mockTable;
    act(() => {
      result.current.focusCell(1, 2);
    });

    // Test Home key (go to first cell in row)
    const homeEvent = {
      key: 'Home',
      preventDefault: vi.fn(),
      ctrlKey: false,
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(homeEvent);
    });

    expect(homeEvent.preventDefault).toHaveBeenCalled();
    expect(result.current.focusedCell).toEqual({ rowIndex: 1, columnIndex: 0 });

    // Test End key (go to last cell in row)
    const endEvent = {
      key: 'End',
      preventDefault: vi.fn(),
      ctrlKey: false,
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(endEvent);
    });

    expect(endEvent.preventDefault).toHaveBeenCalled();
    expect(result.current.focusedCell).toEqual({ rowIndex: 1, columnIndex: 3 });
  });

  it('should handle Ctrl+Home and Ctrl+End navigation', () => {
    const { result } = renderHook(() =>
      useTableKeyboardNavigation({
        totalRows: 3,
        totalColumns: 4,
        onToggleCheckbox: vi.fn(),
        onGetFocusableElement: () => mockElement,
      })
    );

    // Mock the table ref and set initial focus
    result.current.tableRef.current = mockTable;
    act(() => {
      result.current.focusCell(1, 2);
    });

    // Test Ctrl+Home (go to first cell in table)
    const ctrlHomeEvent = {
      key: 'Home',
      preventDefault: vi.fn(),
      ctrlKey: true,
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(ctrlHomeEvent);
    });

    expect(ctrlHomeEvent.preventDefault).toHaveBeenCalled();
    expect(result.current.focusedCell).toEqual({ rowIndex: 0, columnIndex: 0 });

    // Test Ctrl+End (go to last cell in table)
    const ctrlEndEvent = {
      key: 'End',
      preventDefault: vi.fn(),
      ctrlKey: true,
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(ctrlEndEvent);
    });

    expect(ctrlEndEvent.preventDefault).toHaveBeenCalled();
    expect(result.current.focusedCell).toEqual({ rowIndex: 2, columnIndex: 3 });
  });

  it('should respect table boundaries', () => {
    const { result } = renderHook(() =>
      useTableKeyboardNavigation({
        totalRows: 3,
        totalColumns: 4,
        onToggleCheckbox: vi.fn(),
        onGetFocusableElement: () => mockElement,
      })
    );

    // Mock the table ref and set focus to first cell
    result.current.tableRef.current = mockTable;
    act(() => {
      result.current.focusCell(0, 0);
    });

    // Try to go up from first row (should stay in place)
    const arrowUpEvent = {
      key: 'ArrowUp',
      preventDefault: vi.fn(),
      ctrlKey: false,
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(arrowUpEvent);
    });

    expect(result.current.focusedCell).toEqual({ rowIndex: 0, columnIndex: 0 });

    // Try to go left from first column (should stay in place)
    const arrowLeftEvent = {
      key: 'ArrowLeft',
      preventDefault: vi.fn(),
      ctrlKey: false,
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(arrowLeftEvent);
    });

    expect(result.current.focusedCell).toEqual({ rowIndex: 0, columnIndex: 0 });

    // Set focus to last cell
    act(() => {
      result.current.focusCell(2, 3);
    });

    // Try to go down from last row (should stay in place)
    const arrowDownEvent = {
      key: 'ArrowDown',
      preventDefault: vi.fn(),
      ctrlKey: false,
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(arrowDownEvent);
    });

    expect(result.current.focusedCell).toEqual({ rowIndex: 2, columnIndex: 3 });

    // Try to go right from last column (should stay in place)
    const arrowRightEvent = {
      key: 'ArrowRight',
      preventDefault: vi.fn(),
      ctrlKey: false,
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(arrowRightEvent);
    });

    expect(result.current.focusedCell).toEqual({ rowIndex: 2, columnIndex: 3 });
  });

  it('should not prevent default for non-navigation keys', () => {
    const { result } = renderHook(() =>
      useTableKeyboardNavigation({
        totalRows: 3,
        totalColumns: 4,
        onToggleCheckbox: vi.fn(),
        onGetFocusableElement: () => mockElement,
      })
    );

    // Mock the table ref and set initial focus
    result.current.tableRef.current = mockTable;
    act(() => {
      result.current.focusCell(1, 1);
    });

    // Test Enter key (should not prevent default)
    const enterEvent = {
      key: 'Enter',
      preventDefault: vi.fn(),
      ctrlKey: false,
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(enterEvent);
    });

    expect(enterEvent.preventDefault).not.toHaveBeenCalled();
    expect(result.current.focusedCell).toEqual({ rowIndex: 1, columnIndex: 1 });
  });

  it('should not handle navigation when no cell is focused', () => {
    const { result } = renderHook(() =>
      useTableKeyboardNavigation({
        totalRows: 3,
        totalColumns: 4,
        onToggleCheckbox: vi.fn(),
        onGetFocusableElement: () => mockElement,
      })
    );

    // Mock the table ref
    result.current.tableRef.current = mockTable;

    // Test arrow key when no cell is focused
    const arrowDownEvent = {
      key: 'ArrowDown',
      preventDefault: vi.fn(),
      ctrlKey: false,
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(arrowDownEvent);
    });

    expect(arrowDownEvent.preventDefault).not.toHaveBeenCalled();
    expect(result.current.focusedCell).toBeNull();
  });

  it('should return null when getFocusableCell cannot find target row', () => {
    const { result } = renderHook(() =>
      useTableKeyboardNavigation({
        totalRows: 3,
        totalColumns: 4,
        onToggleCheckbox: vi.fn(),
        onGetFocusableElement: (rowIndex, columnIndex) => {
          // Simulate case where row 1 doesn't exist
          if (rowIndex === 1) return null;
          return mockElement;
        },
      })
    );

    const focusableCell = result.current.getFocusableCell(1, 1);
    expect(focusableCell).toBeNull();
  });

  it('should return null when getFocusableCell cannot find target cell', () => {
    const { result } = renderHook(() =>
      useTableKeyboardNavigation({
        totalRows: 3,
        totalColumns: 4,
        onToggleCheckbox: vi.fn(),
        onGetFocusableElement: (rowIndex, columnIndex) => {
          // Simulate case where column 1 doesn't exist in row 0
          if (rowIndex === 0 && columnIndex === 1) return null;
          return mockElement;
        },
      })
    );

    const focusableCell = result.current.getFocusableCell(0, 1);
    expect(focusableCell).toBeNull();
  });

  it('should move to next row first column when tabbing from last column (not last row)', () => {
    const { result } = renderHook(() =>
      useTableKeyboardNavigation({
        totalRows: 3,
        totalColumns: 4,
        onToggleCheckbox: vi.fn(),
        onGetFocusableElement: () => mockElement,
      })
    );

    // Start at row 1, last column (column 3)
    act(() => {
      result.current.focusCell(1, 3);
    });

    const mockEvent = {
      key: 'Tab',
      preventDefault: vi.fn(),
      shiftKey: false,
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(mockEvent);
    });

    // Should move to row 2, first column (column 0)
    expect(result.current.focusedCell).toEqual({ rowIndex: 2, columnIndex: 0 });
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockFocus).toHaveBeenCalledTimes(2); // Initial focus + new focus
  });

  it('should escape table when tabbing from last row last column', () => {
    const { result } = renderHook(() =>
      useTableKeyboardNavigation({
        totalRows: 3,
        totalColumns: 4,
        onToggleCheckbox: vi.fn(),
        onGetFocusableElement: () => mockElement,
      })
    );

    // Start at last row, last column
    result.current.focusCell(2, 3);

    const mockEvent = {
      key: 'Tab',
      preventDefault: vi.fn(),
      shiftKey: false,
    } as unknown as React.KeyboardEvent;

    result.current.handleKeyDown(mockEvent);

    // Should clear focus and escape table
    expect(result.current.focusedCell).toBeNull();
    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('should move to previous row last column when shift-tabbing from first column (not first row)', () => {
    const { result } = renderHook(() =>
      useTableKeyboardNavigation({
        totalRows: 3,
        totalColumns: 4,
        onToggleCheckbox: vi.fn(),
        onGetFocusableElement: () => mockElement,
      })
    );

    // Start at row 2, first column (column 0)
    act(() => {
      result.current.focusCell(2, 0);
    });

    const mockEvent = {
      key: 'Tab',
      preventDefault: vi.fn(),
      shiftKey: true,
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(mockEvent);
    });

    // Should move to row 1, last column (column 3)
    expect(result.current.focusedCell).toEqual({ rowIndex: 1, columnIndex: 3 });
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockFocus).toHaveBeenCalledTimes(2); // Initial focus + new focus
  });

  it('should escape table when shift-tabbing from first row first column', () => {
    const { result } = renderHook(() =>
      useTableKeyboardNavigation({
        totalRows: 3,
        totalColumns: 4,
        onToggleCheckbox: vi.fn(),
        onGetFocusableElement: () => mockElement,
      })
    );

    // Start at first row, first column
    result.current.focusCell(0, 0);

    const mockEvent = {
      key: 'Tab',
      preventDefault: vi.fn(),
      shiftKey: true,
    } as unknown as React.KeyboardEvent;

    result.current.handleKeyDown(mockEvent);

    // Should clear focus and escape table
    expect(result.current.focusedCell).toBeNull();
    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });
});
