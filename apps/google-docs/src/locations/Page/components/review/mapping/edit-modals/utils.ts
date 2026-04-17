const enum AllowedContentTypes {
  INTEGER = 'integer',
  DECIMAL = 'decimal',
  TEXT = 'text',
  SHORT_TEXT = 'short text',
  LONG_TEXT = 'long text',
}

export const getSelectedContentMatch = (value: string) => {
  const trimmedValue = value?.trim() ?? '';

  if (/^[+-]?\d+$/.test(trimmedValue)) {
    return AllowedContentTypes.INTEGER;
  }

  if (/^[+-]?(?:\d+\.\d+|\d+\.|\.\d+)$/.test(trimmedValue)) {
    return AllowedContentTypes.DECIMAL;
  }

  return AllowedContentTypes.TEXT;
};

export const isSelectableFieldType = (fieldType: string, selectedText: string) => {
  const highlightedTextMatch = getSelectedContentMatch(selectedText);
  const normalizedFieldType = fieldType.trim().toLowerCase();

  switch (normalizedFieldType) {
    case AllowedContentTypes.SHORT_TEXT:
    case AllowedContentTypes.LONG_TEXT:
      return true;
    case AllowedContentTypes.INTEGER:
      return highlightedTextMatch === AllowedContentTypes.INTEGER;
    case AllowedContentTypes.DECIMAL:
      return (
        highlightedTextMatch === AllowedContentTypes.INTEGER ||
        highlightedTextMatch === AllowedContentTypes.DECIMAL
      );
    default:
      return false;
  }
};
