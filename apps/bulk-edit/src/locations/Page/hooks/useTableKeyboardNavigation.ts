import { useState, useRef } from 'react';

export interface FocusedCell {
  rowIndex: number;
  columnIndex: number;
}

export interface UseTableKeyboardNavigationProps {
  totalRows: number;
  totalColumns: number;
  onToggleCheckbox?: (rowIndex: number, columnIndex: number) => void;
  onGetFocusableElement: (rowIndex: number, columnIndex: number) => HTMLElement | null;
}

export interface UseTableKeyboardNavigationReturn {
  focusedCell: FocusedCell | null;
  tableRef: React.RefObject<HTMLTableElement>;
  handleKeyDown: (event: React.KeyboardEvent) => void;
  focusCell: (rowIndex: number, columnIndex: number) => void;
  getFocusableCell: (rowIndex: number, columnIndex: number) => HTMLElement | null;
}

export const useTableKeyboardNavigation = ({
  totalRows,
  totalColumns,
  onToggleCheckbox,
  onGetFocusableElement,
}: UseTableKeyboardNavigationProps): UseTableKeyboardNavigationReturn => {
  const tableRef = useRef<HTMLTableElement>(null);
  const [focusedCell, setFocusedCell] = useState<FocusedCell | null>(null);

  const getFocusableCell = (rowIndex: number, columnIndex: number): HTMLElement | null => {
    return onGetFocusableElement(rowIndex, columnIndex);
  };

  const focusCell = (rowIndex: number, columnIndex: number) => {
    const element = getFocusableCell(rowIndex, columnIndex);
    if (element) {
      element.focus();
      setFocusedCell({ rowIndex, columnIndex });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!focusedCell) return;

    const { rowIndex, columnIndex } = focusedCell;

    let newRowIndex = rowIndex;
    let newColumnIndex = columnIndex;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        newRowIndex = Math.max(0, rowIndex - 1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        newRowIndex = Math.min(totalRows - 1, rowIndex + 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        newColumnIndex = Math.max(0, columnIndex - 1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        newColumnIndex = Math.min(totalColumns - 1, columnIndex + 1);
        break;
      case 'Home':
        event.preventDefault();
        if (event.ctrlKey) {
          newRowIndex = 0;
          newColumnIndex = 0;
        } else {
          newColumnIndex = 0;
        }
        break;
      case 'End':
        event.preventDefault();
        if (event.ctrlKey) {
          newRowIndex = totalRows - 1;
          newColumnIndex = totalColumns - 1;
        } else {
          newColumnIndex = totalColumns - 1;
        }
        break;
      case 'Tab':
        event.preventDefault();

        if (event.shiftKey) {
          // Shift+Tab: move backward
          if (columnIndex > 0) {
            newColumnIndex = columnIndex - 1;
          } else if (rowIndex > 0) {
            newRowIndex = rowIndex - 1;
            newColumnIndex = totalColumns - 1;
          } else {
            // At first cell, escape table
            setFocusedCell(null);
            tableRef.current?.blur();
            return;
          }
        } else {
          // Tab: move forward
          if (columnIndex < totalColumns - 1) {
            newColumnIndex = columnIndex + 1;
          } else if (rowIndex < totalRows - 1) {
            newRowIndex = rowIndex + 1;
            newColumnIndex = 0;
          } else {
            // At last cell, escape table
            setFocusedCell(null);
            tableRef.current?.blur();
            return;
          }
        }
        break;
      case 'Enter':
        // Only handle Enter for checkbox columns
        const currentElement = getFocusableCell(rowIndex, columnIndex);
        if (
          currentElement &&
          currentElement.tagName === 'INPUT' &&
          (currentElement as HTMLInputElement).type === 'checkbox'
        ) {
          event.preventDefault();
          onToggleCheckbox?.(rowIndex, columnIndex);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setFocusedCell(null);
        tableRef.current?.blur();
        return;
      default:
        return;
    }

    // Only update focus if the position actually changed
    if (newRowIndex !== rowIndex || newColumnIndex !== columnIndex) {
      focusCell(newRowIndex, newColumnIndex);
    }
  };

  return {
    focusedCell,
    tableRef,
    handleKeyDown,
    focusCell,
    getFocusableCell,
  };
};
