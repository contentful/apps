import { useState, useCallback, useEffect, useRef } from 'react';
import { HEADERS_ROW } from '../utils/constants';

export interface FocusPosition {
  row: number; // HEADER_ROW for header, 0+ for data rows
  column: number;
}

export interface FocusRange {
  start: FocusPosition;
  end: FocusPosition;
}

interface UseKeyboardNavigationProps {
  totalColumns: number;
  entriesLength: number;
  onCellAction: (position: FocusPosition) => void;
}

type Direction = 'up' | 'down' | 'left' | 'right';

interface UseKeyboardNavigationReturn {
  focusedCell: FocusPosition | null;
  focusRange: FocusRange | null;
  isSelecting: boolean;
  setFocusedCell: (position: FocusPosition | null) => void;
  focusCell: (position: FocusPosition) => void;
  tableRef: React.RefObject<HTMLTableElement>;
}

export const useKeyboardNavigation = ({
  totalColumns,
  entriesLength,
  onCellAction,
}: UseKeyboardNavigationProps): UseKeyboardNavigationReturn => {
  const tableRef = useRef<HTMLTableElement>(null);

  // Focus and selection state
  const [focusedCell, setFocusedCell] = useState<FocusPosition | null>(null);
  const [focusRange, setFocusRange] = useState<FocusRange | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const LAST_ROW = entriesLength - 1;
  const LAST_COLUMN = totalColumns - 1;
  const FIRST_COLUMN = 0;

  // Unified movement function
  const moveFocus = (direction: Direction, extendSelection = false, toEdge = false) => {
    if (!focusedCell) return;

    let newPosition = { ...focusedCell };

    switch (direction) {
      case 'up':
        newPosition.row = toEdge ? HEADERS_ROW : Math.max(HEADERS_ROW, focusedCell.row - 1);
        break;
      case 'down':
        newPosition.row = toEdge ? LAST_ROW : Math.min(LAST_ROW, focusedCell.row + 1);
        break;
      case 'left':
        newPosition.column = Math.max(FIRST_COLUMN, focusedCell.column - 1);
        break;
      case 'right':
        newPosition.column = Math.min(LAST_COLUMN, focusedCell.column + 1);
        break;
    }

    // Update selection state
    if (extendSelection) {
      extendSelectionToEdge(focusedCell, newPosition);
    } else {
      setIsSelecting(false);
      setFocusRange(null);
    }

    setFocusedCell(newPosition);

    // Scroll to the focused cell
    const { row, column } = newPosition;
    const cell = tableRef.current?.querySelector(
      `[data-row="${row}"][data-column="${column}"]`
    ) as HTMLElement;

    if (cell) {
      cell.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  };

  const extendSelectionToEdge = (focusedCell: FocusPosition, newPosition: FocusPosition) => {
    if (!isSelecting) {
      setIsSelecting(true);
      setFocusRange({ start: focusedCell, end: newPosition });
    } else {
      setFocusRange((prev) => (prev ? { ...prev, end: newPosition } : null));
    }
  };

  // Select entire column function
  const selectColumn = useCallback(() => {
    if (!focusedCell) return;

    const columnStart = { row: HEADERS_ROW, column: focusedCell.column };
    const columnEnd = { row: LAST_ROW, column: focusedCell.column };

    setIsSelecting(true);
    setFocusRange({ start: columnStart, end: columnEnd });
    setFocusedCell(columnStart); // Focus on header of the column
  }, [focusedCell, LAST_ROW]);

  // Clear focus helper
  const clearFocus = useCallback(() => {
    setFocusedCell(null);
    setIsSelecting(false);
    setFocusRange(null);
    // Also blur the table element to ensure focus moves to next element
    tableRef.current?.blur();
  }, []);

  // Focus cell function - clears selection when focusing on a new cell
  const focusCell = useCallback((position: FocusPosition) => {
    setFocusedCell(position);
    setIsSelecting(false);
    setFocusRange(null);
    // Ensure the table element gets focus so keyboard events are captured
    tableRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!focusedCell) return;

      const { key, shiftKey, altKey, code } = event;

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

      //Special case for Alt + Space to select entire column
      if (code === 'Space' && altKey) {
        event.preventDefault();
        selectColumn();
        return;
      }

      if (handledKeys.includes(key)) {
        event.preventDefault();
      }

      // Handle key actions
      switch (key) {
        case 'ArrowUp':
          const selectToEdgeUp = altKey && shiftKey;
          moveFocus('up', shiftKey, selectToEdgeUp);
          break;
        case 'ArrowDown':
          const selectToEdgeDown = altKey && shiftKey;
          moveFocus('down', shiftKey, selectToEdgeDown);
          break;
        case 'ArrowLeft':
          moveFocus('left');
          break;
        case 'ArrowRight':
          moveFocus('right');
          break;
        case 'Escape':
          clearFocus();
          break;
        case ' ':
          onCellAction(focusedCell);
          break;
        case 'Tab':
          const isAtRightEdge = focusedCell.column === LAST_COLUMN;
          const isAtLeftEdge = focusedCell.column === FIRST_COLUMN;
          const isAtFirstRow = focusedCell.row === HEADERS_ROW;
          const isAtLastRow = focusedCell.row === LAST_ROW;

          const shouldExitLeft = shiftKey && isAtLeftEdge && isAtFirstRow;
          const shouldExitRight = !shiftKey && isAtRightEdge && isAtLastRow;

          // Exit table - let browser handle natural tab navigation
          if (shouldExitLeft || shouldExitRight) {
            clearFocus();
            break;
          }
          event.preventDefault();
          // When we reach to the last column, we move to the first column of the next row
          if (!shiftKey && isAtRightEdge && !isAtLastRow) {
            // Move to first column of next row
            setFocusedCell({ row: focusedCell.row + 1, column: FIRST_COLUMN });
            setIsSelecting(false);
            setFocusRange(null);
          } else if (shiftKey && isAtLeftEdge && !isAtFirstRow) {
            // Move to last column of previous row
            setFocusedCell({ row: focusedCell.row - 1, column: totalColumns - 1 });
            setIsSelecting(false);
            setFocusRange(null);
          } else {
            // Normal left/right movement within the row
            moveFocus(shiftKey ? 'left' : 'right');
          }
          break;

        case 'Enter':
          onCellAction(focusedCell);
          break;
      }
    },
    [focusedCell, onCellAction, totalColumns, selectColumn]
  );

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
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      tableElement.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleKeyDown, handleClickOutside]);

  return {
    focusedCell,
    focusRange,
    isSelecting,
    setFocusedCell,
    focusCell,
    tableRef,
  };
};
