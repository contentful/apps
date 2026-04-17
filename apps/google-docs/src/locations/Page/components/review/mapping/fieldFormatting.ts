export const formatDisplayName = (value: string): string => {
  const normalized = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return value;
  }

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
};

const FIELD_TYPE_LABELS: Record<string, string> = {
  Symbol: 'Short text',
  Text: 'Long text',
  RichText: 'Rich text',
  Integer: 'Integer',
  Number: 'Number',
  Date: 'Date & time',
  Boolean: 'Boolean',
  Object: 'JSON object',
  Location: 'Location',
  Link: 'Media',
  Array: 'List',
  ResourceLink: 'Resource link',
};

export const FIELD_TYPE_DISPLAY = {
  SHORT_TEXT: FIELD_TYPE_LABELS.Symbol,
  LONG_TEXT: FIELD_TYPE_LABELS.Text,
  INTEGER: FIELD_TYPE_LABELS.Integer,
  DECIMAL: FIELD_TYPE_LABELS.Number,
} as const;

export const getFieldTypeLabel = (fieldType: string): string =>
  FIELD_TYPE_LABELS[fieldType] ?? fieldType;
