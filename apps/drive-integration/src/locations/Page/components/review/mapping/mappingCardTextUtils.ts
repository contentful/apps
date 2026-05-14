export const MAX_VALUE_LENGTH = 35;

export const FIELD_TYPE_SEPARATOR = ' | ';

export const truncate = (str: string, maxLength: number = MAX_VALUE_LENGTH): string =>
  str.length > maxLength ? `${str.slice(0, maxLength)} ...` : str;

export interface SplitFieldValue {
  labelPart: string;
  typePart: string | null;
  fullValue: string;
  truncatedValue: string;
  isTruncated: boolean;
}

export const truncateFieldValue = (
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
