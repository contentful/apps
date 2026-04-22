import type { EditModalFieldOption } from '@types';
import { FIELD_TYPE_LABELS } from '../fieldFormatting';

const FIELD_TYPE_DISPLAY = {
  SHORT_TEXT: FIELD_TYPE_LABELS.Symbol,
  LONG_TEXT: FIELD_TYPE_LABELS.Text,
  INTEGER: FIELD_TYPE_LABELS.Integer,
  DECIMAL: FIELD_TYPE_LABELS.Number,
} as const;

export const getSelectedContentMatch = (value: string) => {
  const trimmedValue = value?.trim() ?? '';

  if (/^[+-]?\d+$/.test(trimmedValue)) {
    return FIELD_TYPE_DISPLAY.INTEGER;
  }

  if (/^[+-]?(?:\d+\.\d+|\d+\.|\.\d+)$/.test(trimmedValue)) {
    return FIELD_TYPE_DISPLAY.DECIMAL;
  }

  return;
};

export const isSelectableFieldType = (
  field: Pick<EditModalFieldOption, 'fieldDisplayType'>,
  selectedText: string
) => {
  const highlightedTextMatch = getSelectedContentMatch(selectedText);
  const normalizedFieldType = field.fieldDisplayType.trim();

  switch (normalizedFieldType) {
    case FIELD_TYPE_DISPLAY.SHORT_TEXT:
    case FIELD_TYPE_DISPLAY.LONG_TEXT:
      return true;
    case FIELD_TYPE_DISPLAY.INTEGER:
      return highlightedTextMatch === FIELD_TYPE_DISPLAY.INTEGER;
    case FIELD_TYPE_DISPLAY.DECIMAL:
      return (
        highlightedTextMatch === FIELD_TYPE_DISPLAY.INTEGER ||
        highlightedTextMatch === FIELD_TYPE_DISPLAY.DECIMAL
      );
    default:
      return false;
  }
};
