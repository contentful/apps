import { useState, useRef, useEffect } from 'react';
import { styles } from '../styles';
import { isCheckboxAllowed } from '../utils/entryUtils';
import { ContentTypeField } from '../types';

interface UseTableCellFocusProps {
  fields?: ContentTypeField[];
  rowIndex: number;
  onCellFocus?: (rowIndex: number, columnIndex: number) => void;
  onRegisterFocusableElement?: (key: string, element: HTMLElement | null) => void;
}

export const useTableCellFocus = ({
  fields = [],
  rowIndex,
  onCellFocus,
  onRegisterFocusableElement,
}: UseTableCellFocusProps) => {
  const [focusedColumn, setFocusedColumn] = useState<number | null>(null);

  // Refs for different types of elements - using any to allow flexibility for different element types
  const displayNameRef = useRef<any>(null);
  const statusRef = useRef<any>(null);
  const fieldRefs = useRef<Map<string, HTMLElement>>(new Map());
  const checkboxRefs = useRef<Map<string, HTMLElement>>(new Map());

  const handleCellFocus = (columnIndex: number) => {
    setFocusedColumn(columnIndex);
    if (onCellFocus) {
      onCellFocus(rowIndex, columnIndex);
    }
  };

  const handleCellBlur = () => {
    setFocusedColumn(null);
  };

  const getTextStyle = (columnIndex: number) => {
    return focusedColumn === columnIndex ? styles.focusedHeader : {};
  };

  const getCheckboxStyle = (columnIndex: number) => {
    return focusedColumn === columnIndex ? styles.focusedHeader : {};
  };

  // Register focusable elements
  useEffect(() => {
    if (onRegisterFocusableElement) {
      // Register display name and status
      onRegisterFocusableElement(`${rowIndex}-0`, displayNameRef.current);
      onRegisterFocusableElement(`${rowIndex}-1`, statusRef.current);

      // Register field refs and checkbox refs
      fields.forEach((field, fieldIndex) => {
        const columnIndex = 2 + fieldIndex;
        const fieldRef = fieldRefs.current.get(field.uniqueId);
        const checkboxRef = checkboxRefs.current.get(field.uniqueId);

        // For fields with checkboxes, prioritize the checkbox as the focusable element
        if (isCheckboxAllowed(field) && checkboxRef) {
          onRegisterFocusableElement(`${rowIndex}-${columnIndex}`, checkboxRef);
        } else {
          onRegisterFocusableElement(`${rowIndex}-${columnIndex}`, fieldRef || null);
        }
      });
    }
  }, [fields, rowIndex, onRegisterFocusableElement]);

  return {
    // State
    focusedColumn,

    // Refs
    displayNameRef,
    statusRef,
    fieldRefs,
    checkboxRefs,

    // Handlers
    handleCellFocus,
    handleCellBlur,

    // Style functions
    getTextStyle,
    getCheckboxStyle,
  };
};
