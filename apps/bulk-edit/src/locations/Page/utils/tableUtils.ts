import tokens from '@contentful/f36-tokens';
import { ContentTypeField } from '../types';
import { DISPLAY_NAME_COLUMN, ENTRY_STATUS_COLUMN } from './constants';
import { FocusPosition, SelectionRange } from '../hooks/useKeyboardNavigation';
import { focusedCell } from '../styles';

export const getCellStyle = (
  baseStyle: React.CSSProperties,
  isFocused: boolean,
  isSelected: boolean
): React.CSSProperties => {
  return {
    ...baseStyle,
    ...((isFocused || isSelected) && focusedCell),
  };
};

export const getColumnIndex = (
  field: ContentTypeField | string,
  fields: ContentTypeField[]
): number => {
  const fieldId = typeof field === 'string' ? field : field.uniqueId;
  const allColumns = [DISPLAY_NAME_COLUMN, ENTRY_STATUS_COLUMN, ...fields.map((f) => f.uniqueId)];
  return allColumns.indexOf(fieldId);
};

export const isCellFocused = (
  rowIndex: number,
  columnIndex: number,
  focusedCell: FocusPosition | null
): boolean => {
  return focusedCell?.row === rowIndex && focusedCell?.column === columnIndex;
};

export const isCellSelected = (
  rowIndex: number,
  columnIndex: number,
  selectionRange: SelectionRange | null
): boolean => {
  if (!selectionRange) return false;
  const { start, end } = selectionRange;
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);

  return rowIndex >= minRow && rowIndex <= maxRow && columnIndex === start.column;
};
