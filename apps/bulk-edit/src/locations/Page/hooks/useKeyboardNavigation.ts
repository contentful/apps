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
  onCellAction?: (rowIndex: number, columnIndex: number) => void;
}

type Direction = 'up' | 'down' | 'left' | 'right';

interface UseKeyboardNavigationReturn {
  focusedCell: FocusPosition | null;
  selectionRange: SelectionRange | null;
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
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null);
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
      setSelectionRange(null);
    }

    setFocusedCell(newPosition);
  };

  const extendSelectionToEdge = (focusedCell: FocusPosition, newPosition: FocusPosition) => {
    if (!isSelecting) {
      setIsSelecting(true);
      setSelectionRange({ start: focusedCell, end: newPosition });
    } else {
      setSelectionRange((prev) => (prev ? { ...prev, end: newPosition } : null));
    }
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

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!focusedCell) return;

      const { key, shiftKey, altKey, metaKey } = event;
      const isMac = navigator.userAgent.includes('Mac');
      const isEdgeSelectKey = isMac ? metaKey : altKey;

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
          const selectToEdgeUp = isEdgeSelectKey && shiftKey;
          moveFocus('up', shiftKey, selectToEdgeUp);
          break;
        case 'ArrowDown':
          const selectToEdgeDown = isEdgeSelectKey && shiftKey;
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
          if (onCellAction) {
            onCellAction(focusedCell.row, focusedCell.column);
          }
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
          break;

        case 'Enter':
          if (shiftKey) {
            moveFocus('up');
          } else {
            // Let the parent component decide what action to take for this cell
            if (onCellAction) {
              onCellAction(focusedCell.row, focusedCell.column);
            }

            // Move focus down if we're not on the header row
            if (focusedCell.row !== HEADERS_ROW) {
              moveFocus('down');
            }
          }
          break;
      }
    },
    [focusedCell, onCellAction, totalColumns]
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
    tableRef,
  };
};
