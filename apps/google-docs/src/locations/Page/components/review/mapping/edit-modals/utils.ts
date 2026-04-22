import { FIELD_TYPE_DISPLAY, getFieldTypeLabel } from '../fieldFormatting';

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

export const isSelectableFieldType = (fieldType: string, selectedText: string) => {
  const highlightedTextMatch = getSelectedContentMatch(selectedText);
  const normalizedFieldType = getFieldTypeLabel(fieldType).trim();

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
