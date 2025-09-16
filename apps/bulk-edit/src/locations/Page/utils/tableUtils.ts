import tokens from '@contentful/f36-tokens';
import { ContentTypeField } from '../types';
import { DISPLAY_NAME_COLUMN, ENTRY_STATUS_COLUMN } from './constants';
import { FocusPosition, FocusRange } from '../hooks/useKeyboardNavigation';
import { focusedCell } from '../styles';

export const getCellStyle = (
  baseStyle: React.CSSProperties,
  isFocused: boolean
): React.CSSProperties => {
  return {
    ...baseStyle,
    ...(isFocused && focusedCell),
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
  position: FocusPosition,
  focusedCell: FocusPosition | null
): boolean => {
  return focusedCell?.row === position.row && focusedCell?.column === position.column;
};

export const isCellInFocusRange = (
  position: FocusPosition,
  selectionRange: FocusRange | null
): boolean => {
  if (!selectionRange) return false;
  const { start, end } = selectionRange;
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);

  return position.row >= minRow && position.row <= maxRow && position.column === start.column;
};
