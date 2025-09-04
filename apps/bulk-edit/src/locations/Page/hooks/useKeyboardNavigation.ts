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

  // Helper function to validate position
  const isValidPosition = useCallback(
    (position: FocusPosition) => {
      return (
        position.row >= -1 &&
        position.row < entriesLength &&
        position.column >= 0 &&
        position.column < totalColumns
      );
    },
    [entriesLength, totalColumns]
  );

  // Internal navigation functions
  const moveFocus = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right', extendSelection = false) => {
      if (!focusedCell) return;

      let newPosition = { ...focusedCell };

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

      if (isValidPosition(newPosition)) {
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
      }
    },
    [focusedCell, entriesLength, totalColumns, isSelecting, isValidPosition]
  );

  const extendSelectionToEdge = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (!focusedCell) return;

      let newPosition = { ...focusedCell };

      switch (direction) {
        case 'up':
          newPosition.row = -1; // Header row
          break;
        case 'down':
          newPosition.row = entriesLength - 1; // Last row
          break;
        case 'left':
          newPosition.column = 0; // First column
          break;
        case 'right':
          newPosition.column = totalColumns - 1; // Last column
          break;
      }

      if (isValidPosition(newPosition)) {
        if (!isSelecting) {
          setIsSelecting(true);
          setSelectionRange({ start: focusedCell, end: newPosition });
        } else {
          setSelectionRange((prev) => (prev ? { ...prev, end: newPosition } : null));
        }
        setFocusedCell(newPosition);
      }
    },
    [focusedCell, entriesLength, totalColumns, isSelecting, isValidPosition]
  );

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
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isEdgeSelectKey = isMac ? metaKey : altKey;

      // Handle Alt+Space / Option+Space for column selection
      if (code === 'Space' && altKey) {
        event.preventDefault();
        focusColumn(focusedCell.column);
        return;
      }

      // Handle other keys
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

      switch (key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          const direction = key.replace('Arrow', '').toLowerCase() as
            | 'up'
            | 'down'
            | 'left'
            | 'right';
          if (isEdgeSelectKey && shiftKey) {
            extendSelectionToEdge(direction);
          } else if (shiftKey) {
            moveFocus(direction, true);
          } else {
            moveFocus(direction);
          }
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
    [focusedCell, moveFocus, onToggleSelection, extendSelectionToEdge, focusColumn]
  );

  // Add keyboard event listeners
  useEffect(() => {
    const tableElement = tableRef.current;
    if (tableElement) {
      // Global event listener to catch Alt+Space even when table is not focused
      const handleGlobalKeyDown = (event: KeyboardEvent) => {
        if (event.key === ' ' && event.altKey && focusedCell) {
          event.preventDefault();
          event.stopPropagation();
          focusColumn(focusedCell.column);
        }
      };

      tableElement.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keydown', handleGlobalKeyDown);

      return () => {
        tableElement.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keydown', handleGlobalKeyDown);
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
