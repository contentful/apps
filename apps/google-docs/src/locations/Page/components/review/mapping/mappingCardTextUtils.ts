/** Maximum visible character budget for mapping-card values (field/entry/content type). */
export const MAX_VALUE_LENGTH = 35;

/** Separator used between a field name and its display type in mapping cards. */
export const FIELD_TYPE_SEPARATOR = ' | ';

/** Truncate a string to `maxLength`, appending an ellipsis when shortened. */
export const truncate = (str: string, maxLength: number = MAX_VALUE_LENGTH): string =>
  str.length > maxLength ? `${str.slice(0, maxLength)} ...` : str;

export interface SplitFieldValue {
  /** The (possibly truncated) field name part, before the type separator. */
  labelPart: string;
  /** The (possibly truncated) field type part, or `null` when truncation removed it. */
  typePart: string | null;
  /** The full untruncated `${fieldName} | ${fieldType}` value. */
  fullValue: string;
  /** The combined value after truncation. Equals `fullValue` when no truncation occurred. */
  truncatedValue: string;
  /** Whether the combined value was truncated. */
  isTruncated: boolean;
}

/**
 * Build a single truncation budget across `${fieldName}${SEPARATOR}${fieldType}` and split it
 * back so callers can style the type part differently while keeping the overall length capped.
 */
export const truncateFieldPart = (
  fieldName: string,
  fieldType: string,
  maxLength: number = MAX_VALUE_LENGTH
): SplitFieldValue => {
  const fullValue = `${fieldName}${FIELD_TYPE_SEPARATOR}${fieldType}`;
  const truncatedValue = truncate(fullValue, maxLength);
  const separatorIndex = truncatedValue.indexOf(FIELD_TYPE_SEPARATOR);
  const hasTypePart = separatorIndex !== -1;
  const labelPart = hasTypePart ? fieldName : truncatedValue;
  const typePart = hasTypePart
    ? truncatedValue.slice(separatorIndex + FIELD_TYPE_SEPARATOR.length)
    : null;

  return {
    labelPart,
    typePart,
    fullValue,
    truncatedValue,
    isTruncated: truncatedValue !== fullValue,
  };
};
