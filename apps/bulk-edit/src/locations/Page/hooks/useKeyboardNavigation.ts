import { useState, useCallback, useEffect, useRef } from 'react';
import { HEADERS_ROW } from '../utils/constants';

export interface FocusPosition {
  row: number; // HEADER_ROW for header, 0+ for data rows
  column: number;
}

export interface SelectionRange {
  start: FocusPosition;
  end: FocusPosition;
}

interface UseKeyboardNavigationProps {
  totalColumns: number;
  entriesLength: number;
  onFocusColumn: (columnIndex: number) => void;
  onToggleSelection: () => void;
}

interface UseKeyboardNavigationReturn {
  focusedCell: FocusPosition | null;
  selectionRange: SelectionRange | null;
  isSelecting: boolean;
  setFocusedCell: (position: FocusPosition | null) => void;
  focusCell: (position: FocusPosition) => void;
  focusColumn: (columnIndex: number) => void;
  tableRef: React.RefObject<HTMLTableElement>;
}

export const useKeyboardNavigation = ({
  totalColumns,
  entriesLength,
  onFocusColumn,
  onToggleSelection,
}: UseKeyboardNavigationProps): UseKeyboardNavigationReturn => {
  const tableRef = useRef<HTMLTableElement>(null);

  // Focus and selection state
  const [focusedCell, setFocusedCell] = useState<FocusPosition | null>(null);
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Unified movement function
  const moveFocus = (
    direction: 'up' | 'down' | 'left' | 'right',
    extendSelection = false,
    toEdge = false
  ) => {
    if (!focusedCell) return;

    let newPosition = { ...focusedCell };

    switch (direction) {
      case 'up':
        newPosition.row = toEdge ? HEADERS_ROW : Math.max(HEADERS_ROW, focusedCell.row - 1);
        break;
      case 'down':
        newPosition.row = toEdge
          ? entriesLength - 1
          : Math.min(entriesLength - 1, focusedCell.row + 1);
        break;
      case 'left':
        newPosition.column = Math.max(0, focusedCell.column - 1);
        break;
      case 'right':
        newPosition.column = Math.min(totalColumns - 1, focusedCell.column + 1);
        break;
    }

    // Update selection state
    if (extendSelection) {
      if (!isSelecting) {
        setIsSelecting(true);
        setSelectionRange({ start: focusedCell, end: newPosition });
      } else {
        setSelectionRange((prev) => (prev ? { ...prev, end: newPosition } : null));
      }
    } else {
      setIsSelecting(false);
      setSelectionRange(null);
    }

    setFocusedCell(newPosition);
  };

  // Clear focus helper
  const clearFocus = useCallback(() => {
    setFocusedCell(null);
    setIsSelecting(false);
    setSelectionRange(null);
    // Also blur the table element to ensure focus moves to next element
    tableRef.current?.blur();
  }, []);

  // Focus cell function - clears selection when focusing on a new cell
  const focusCell = useCallback(
    (position: FocusPosition) => {
      clearFocus();
      setFocusedCell(position);
      // Ensure the table element gets focus so keyboard events are captured
      tableRef.current?.focus();
    },
    [clearFocus]
  );

  // Focus column function
  const focusColumn = useCallback(
    (columnIndex: number) => {
      if (columnIndex >= 0 && columnIndex < totalColumns) {
        const startPosition: FocusPosition = { row: HEADERS_ROW, column: columnIndex };
        const endPosition: FocusPosition = { row: entriesLength - 1, column: columnIndex };

        setFocusedCell(startPosition);
        setIsSelecting(true);
        setSelectionRange({ start: startPosition, end: endPosition });
        onFocusColumn(columnIndex);
        // Ensure the table element gets focus so keyboard events are captured
        if (tableRef.current) {
          tableRef.current.focus();
        }
      }
    },
    [totalColumns, entriesLength, onFocusColumn]
  );

  // Simplified keyboard event handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!focusedCell) return;

      const { key, shiftKey, altKey, metaKey } = event;
      const isMac = navigator.userAgent.includes('Mac');
      const isEdgeSelectKey = isMac ? metaKey : altKey;

      // Check if we're at table boundaries for Tab navigation
      const isAtRightEdge = focusedCell.column === totalColumns - 1;
      const isAtLeftEdge = focusedCell.column === 0;
      const isAtFirstRow = focusedCell.row === HEADERS_ROW;
      const isAtLastRow = focusedCell.row === entriesLength - 1;

      // Handle Tab key specially for table exit and row wrapping
      if (key === 'Tab') {
        // Exit conditions: first cell with Shift+Tab, or last cell with Tab
        const shouldExitLeft = shiftKey && isAtLeftEdge && isAtFirstRow;
        const shouldExitRight = !shiftKey && isAtRightEdge && isAtLastRow;

        if (shouldExitLeft || shouldExitRight) {
          // Exit table - let browser handle natural tab navigation
          clearFocus();
          return;
        }

        event.preventDefault();

        // Handle row wrapping for Tab navigation
        if (!shiftKey && isAtRightEdge && !isAtLastRow) {
          // Move to first column of next row
          setFocusedCell({ row: focusedCell.row + 1, column: 0 });
          setIsSelecting(false);
          setSelectionRange(null);
        } else if (shiftKey && isAtLeftEdge && !isAtFirstRow) {
          // Move to last column of previous row
          setFocusedCell({ row: focusedCell.row - 1, column: totalColumns - 1 });
          setIsSelecting(false);
          setSelectionRange(null);
        } else {
          // Normal left/right movement within the row
          moveFocus(shiftKey ? 'left' : 'right');
        }
        return;
      }

      // Handle special key combinations
      if (key === ' ' && altKey) {
        event.preventDefault();
        focusColumn(focusedCell.column);
        return;
      }

      // Prevent default for handled keys
      const handledKeys = [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Enter',
        'Escape',
        ' ',
      ];
      if (handledKeys.includes(key)) {
        event.preventDefault();
      }

      // Handle key actions
      switch (key) {
        case 'ArrowUp':
        case 'ArrowDown':
          const toEdge = isEdgeSelectKey && shiftKey;
          moveFocus(key === 'ArrowUp' ? 'up' : 'down', shiftKey, toEdge);
          break;
        case 'ArrowLeft':
          moveFocus('left');
          break;
        case 'ArrowRight':
          moveFocus('right');
          break;
        case 'Enter':
          if (shiftKey) {
            moveFocus('up');
          } else {
            onToggleSelection();
            if (focusedCell.row !== HEADERS_ROW) {
              moveFocus('down');
            }
          }
          break;
        case 'Escape':
          clearFocus();
          break;
        case ' ':
          onToggleSelection();
          break;
      }
    },
    [focusedCell, onToggleSelection, focusColumn, totalColumns, clearFocus]
  );

  // Handle table focus - set initial focus when table receives focus
  const handleTableFocus = useCallback(() => {
    if (!focusedCell && entriesLength > 0) {
      setFocusedCell({ row: HEADERS_ROW, column: 0 });
    }
  }, [focusedCell, entriesLength]);

  // Handle click outside table
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      const tableElement = tableRef.current;
      if (tableElement && !tableElement.contains(event.target as Node)) {
        clearFocus();
      }
    },
    [clearFocus]
  );

  // Setup event listeners
  useEffect(() => {
    const tableElement = tableRef.current;
    if (!tableElement) return;

    tableElement.addEventListener('keydown', handleKeyDown);
    tableElement.addEventListener('focus', handleTableFocus);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      tableElement.removeEventListener('keydown', handleKeyDown);
      tableElement.removeEventListener('focus', handleTableFocus);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleKeyDown, handleTableFocus, handleClickOutside]);

  return {
    focusedCell,
    selectionRange,
    isSelecting,
    setFocusedCell,
    focusCell,
    focusColumn,
    tableRef,
  };
};
