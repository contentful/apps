import type { NormalizedDocumentTabBlock } from '@types';
import type { MappingReviewSuspendPayload, CompletedWorkflowPayload } from '../types/workflow';

const DEFAULT_UNTABBED_DOCUMENT_TAB_NAME = 'tab 1';

export const truncateLabel = (label: string, maxLength: number = 10): string => {
  if (label.length <= maxLength) return label;

  const halfLength = Math.floor(maxLength / 2);
  const firstHalf = label.slice(0, halfLength).trim();
  const secondHalf = label.slice(label.length - halfLength).trim();

  return `${firstHalf}...${secondHalf}`;
};

export const isPreviewPayload = (
  payload: CompletedWorkflowPayload | MappingReviewSuspendPayload
): payload is CompletedWorkflowPayload => {
  return 'entries' in payload && 'referenceGraph' in payload;
};

export const getTabDisplayName = (tab: NormalizedDocumentTabBlock, tabCount: number): string => {
  const tabName = tab.name.trim();

  if (tabCount === 1 && tabName.toLowerCase() === DEFAULT_UNTABBED_DOCUMENT_TAB_NAME) {
    return '';
  }

  return tab.name;
};
