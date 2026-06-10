import type { NormalizedDocumentTabBlock } from '@types';
import type { MappingReviewSuspendPayload, CompletedWorkflowPayload } from '../types/workflow';

export const DEFAULT_TRUNCATE_END_LENGTH = 35;
export const FIELD_TYPE_SEPARATOR = ' | ';

export const truncateEnd = (
  text: string,
  maxLength: number = DEFAULT_TRUNCATE_END_LENGTH
): string => (text.length > maxLength ? `${text.slice(0, maxLength)} ...` : text);

export const truncateMiddle = (text: string, maxLength: number = 10): string => {
  if (text.length <= maxLength) return text;

  const halfLength = Math.floor(maxLength / 2);
  const firstHalf = text.slice(0, halfLength).trim();
  const secondHalf = text.slice(text.length - halfLength).trim();

  return `${firstHalf}...${secondHalf}`;
};

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
  maxLength: number = DEFAULT_TRUNCATE_END_LENGTH
): SplitFieldValue => {
  const fullValue = `${fieldName}${FIELD_TYPE_SEPARATOR}${fieldType}`;
  const truncatedValue = truncateEnd(fullValue, maxLength);
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

export const isPreviewPayload = (
  payload: CompletedWorkflowPayload | MappingReviewSuspendPayload
): payload is CompletedWorkflowPayload => {
  return 'entries' in payload && 'referenceGraph' in payload;
};

export const getTabDisplayName = (tab: NormalizedDocumentTabBlock, tabCount: number): string => {
  if (tabCount === 1) {
    return '';
  }

  return tab.name;
};
