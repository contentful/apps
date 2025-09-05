import { useState, useCallback, useEffect, useRef } from 'react';

export interface FocusPosition {
  row: number; // -1 for header, 0+ for data rows
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

  // Internal navigation functions
  const moveFocus = (direction: 'up' | 'down' | 'left' | 'right', extendSelection = false) => {
    if (!focusedCell) return;

    let newPosition = { ...focusedCell };

    //Moves across the table in the specified direction
    // If you reach the edge of the table, you will not be able to move further
    switch (direction) {
      case 'up':
        newPosition.row = Math.max(-1, focusedCell.row - 1);
        break;
      case 'down':
        newPosition.row = Math.min(entriesLength - 1, focusedCell.row + 1);
        break;
      case 'left':
        newPosition.column = Math.max(0, focusedCell.column - 1);
        break;
      case 'right':
        newPosition.column = Math.min(totalColumns - 1, focusedCell.column + 1);
        break;
    }

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

  const extendFocusToEdge = (direction: 'up' | 'down') => {
    if (!focusedCell) return;

    let newPosition = { ...focusedCell };

    if (direction === 'up') {
      newPosition.row = -1; // Header row
    } else {
      newPosition.row = entriesLength - 1; // Last row
    }

    if (!isSelecting) {
      setIsSelecting(true);
      setSelectionRange({ start: focusedCell, end: newPosition });
    } else {
      setSelectionRange((prev) => (prev ? { ...prev, end: newPosition } : null));
    }
    setFocusedCell(newPosition);
  };

  // Focus column function
  const focusColumn = useCallback(
    (columnIndex: number) => {
      if (columnIndex >= 0 && columnIndex < totalColumns) {
        const startPosition: FocusPosition = { row: -1, column: columnIndex };
        const endPosition: FocusPosition = { row: entriesLength - 1, column: columnIndex };

        setFocusedCell(startPosition);
        setIsSelecting(true);
        setSelectionRange({ start: startPosition, end: endPosition });
        onFocusColumn(columnIndex);
      }
    },
    [totalColumns, entriesLength, onFocusColumn]
  );

  // Keyboard event handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!focusedCell) return;

      const { key, shiftKey, altKey, metaKey, code } = event;
      const isMac = navigator.userAgent.includes('Mac');
      const isEdgeSelectKey = isMac ? metaKey : altKey;

      const handledKeys = [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Tab',
        'Enter',
        'Escape',
        ' ',
      ];
      if (handledKeys.includes(key)) {
        event.preventDefault();
      }

      //It doesnt make sense to expand left or right selection in the table
      //Because we don't allow editing multiple fields at once
      const moveKeyVertically = (direction: 'up' | 'down') => {
        if (isEdgeSelectKey && shiftKey) {
          extendFocusToEdge(direction);
        } else if (shiftKey) {
          moveFocus(direction, true);
        } else {
          moveFocus(direction);
        }
      };

      if (code === 'Space' && altKey) {
        event.preventDefault();
        focusColumn(focusedCell.column);
        return;
      }

      switch (key) {
        case 'ArrowUp':
          moveKeyVertically('up');
          break;
        case 'ArrowDown':
          moveKeyVertically('down');
          break;
        case 'ArrowLeft':
          moveFocus('left');
          break;
        case 'ArrowRight':
          moveFocus('right');
          break;
        case 'Tab':
          moveFocus(shiftKey ? 'left' : 'right');
          break;

        case 'Enter':
          if (shiftKey) {
            moveFocus('up');
          } else {
            onToggleSelection();
            if (focusedCell.row !== -1) {
              moveFocus('down');
            }
          }
          break;

        case 'Escape':
          setFocusedCell(null);
          setIsSelecting(false);
          setSelectionRange(null);
          break;

        case ' ':
          onToggleSelection();
          break;
      }
    },
    [focusedCell, onToggleSelection, focusColumn]
  );

  // Add keyboard event listeners
  useEffect(() => {
    const tableElement = tableRef.current;
    if (tableElement) {
      tableElement.addEventListener('keydown', handleKeyDown);

      return () => {
        tableElement.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, focusedCell, focusColumn]);

  // Add click-away listener to unfocus cells when clicking outside the table
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const tableElement = tableRef.current;
      if (tableElement && !tableElement.contains(event.target as Node)) {
        setFocusedCell(null);
        setIsSelecting(false);
        setSelectionRange(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return {
    focusedCell,
    selectionRange,
    isSelecting,
    setFocusedCell,
    focusColumn,
    tableRef,
  };
};
